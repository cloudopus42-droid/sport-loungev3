import { Router, Request, Response } from 'express';
import { createStorySchema, updateOrderSchema } from '../schemas/story.schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { uploadSingle, uploadToSupabase, deleteFromSupabase } from '../middleware/upload';
import { supabase } from '../config/supabase';
import { asyncHandler, stripUndefined } from '../utils/http';

const router = Router();

function mapStoryToFrontend(s: any) {
  if (!s) return null;
  return {
    id: s.id,
    mediaUrl: s.media_url,
    mediaType: s.media_type,
    durationSeconds: s.duration_seconds,
    sortOrder: s.sort_order,
    isActive: s.is_active,
    createdAt: s.created_at,
  };
}

function mapStoryToDb(body: any) {
  const dbData: any = {};
  if (body.mediaUrl !== undefined) dbData.media_url = body.mediaUrl;
  if (body.mediaType !== undefined) dbData.media_type = body.mediaType;
  if (body.durationSeconds !== undefined) dbData.duration_seconds = Number(body.durationSeconds);
  if (body.sortOrder !== undefined) dbData.sort_order = Number(body.sortOrder);
  if (body.isActive !== undefined) dbData.is_active = Boolean(body.isActive);
  return dbData;
}

// GET /api/stories — Public, active stories sorted by sortOrder
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json((stories || []).map(mapStoryToFrontend));
}));

// GET /api/stories/all — Auth + Admin, all stories
router.get('/all', auth, isAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json((stories || []).map(mapStoryToFrontend));
}));

// PUT /api/stories/reorder — Auth + Admin, bulk reorder
router.put(
  '/reorder',
  auth,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const items = updateOrderSchema.parse(req.body);

    // Массовое обновление в цикле через Promise.all
    await Promise.all(
      items.map((item) =>
        supabase
          .from('stories')
          .update({ sort_order: item.sortOrder })
          .eq('id', item.id)
      )
    );

    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((stories || []).map(mapStoryToFrontend));
  })
);

// POST /api/stories — Auth + Admin + upload
router.post(
  '/',
  auth,
  isAdmin,
  uploadSingle('media'),
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = createStorySchema.parse({
      ...req.body,
      durationSeconds: req.body.durationSeconds
        ? Number(req.body.durationSeconds)
        : undefined,
      sortOrder: req.body.sortOrder ? Number(req.body.sortOrder) : undefined,
      isActive: req.body.isActive !== undefined
        ? req.body.isActive === 'true' || req.body.isActive === true
        : undefined,
    });

    if (!req.file) {
      res.status(400).json({ error: 'Медиа файл обязателен', status: 400 });
      return;
    }

    // Загружаем файл в Supabase Storage
    const mediaUrl = await uploadToSupabase(req.file, 'stories');

    const dbData = mapStoryToDb(parsedData);
    dbData.media_url = mediaUrl;

    // Определяем тип медиа файла
    if (req.file.mimetype.startsWith('video/')) {
      dbData.media_type = 'video';
    } else {
      dbData.media_type = 'image';
    }

    const { data: story, error } = await supabase
      .from('stories')
      .insert(dbData)
      .select()
      .single();

    if (error || !story) {
      res.status(500).json({ error: 'Не удалось создать сторис: ' + error?.message });
      return;
    }

    res.status(201).json(mapStoryToFrontend(story));
  })
);

// PUT /api/stories/:id — Auth + Admin + upload
router.put(
  '/:id',
  auth,
  isAdmin,
  uploadSingle('media'),
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = createStorySchema.partial().parse({
      ...req.body,
      durationSeconds: req.body.durationSeconds
        ? Number(req.body.durationSeconds)
        : undefined,
      sortOrder: req.body.sortOrder ? Number(req.body.sortOrder) : undefined,
      isActive: req.body.isActive !== undefined
        ? req.body.isActive === 'true' || req.body.isActive === true
        : undefined,
    });

    const dbData = mapStoryToDb(parsedData);

    if (req.file) {
      const { data: oldStory } = await supabase
        .from('stories')
        .select('media_url')
        .eq('id', req.params.id)
        .maybeSingle();

      if (oldStory?.media_url) {
        await deleteFromSupabase(oldStory.media_url);
      }

      dbData.media_url = await uploadToSupabase(req.file, 'stories');

      if (req.file.mimetype.startsWith('video/')) {
        dbData.media_type = 'video';
      } else {
        dbData.media_type = 'image';
      }
    }

    // Удаляем undefined значения из объекта обновления
    stripUndefined(dbData);

    const { data: story, error } = await supabase
      .from('stories')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !story) {
      res.status(404).json({ error: 'Сторис не найдена', status: 404 });
      return;
    }

    res.json(mapStoryToFrontend(story));
  })
);

// DELETE /api/stories/:id — Auth + Admin
router.delete(
  '/:id',
  auth,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('media_url')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchError || !story) {
      res.status(404).json({ error: 'Сторис не найдена', status: 404 });
      return;
    }

    if (story.media_url) {
      await deleteFromSupabase(story.media_url);
    }

    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.json({ message: 'Сторис удалена' });
  })
);

export default router;
