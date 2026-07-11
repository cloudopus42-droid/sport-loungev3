import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import { createPageSchema, updatePageSchema } from '../schemas/pages.schema';
import { asyncHandler } from '../utils/http';

const router = Router();

// GET /api/pages — list published pages (public) or all pages (admin)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const isAdminRequest = req.headers.authorization?.startsWith('Bearer ');
  let query = supabase.from('pages').select('*');

  if (!isAdminRequest) {
    query = query.eq('is_published', true);
  }

  const { data: pages, error } = await query.order('sort_order', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(pages || []);
}));

// GET /api/pages/:slug — get page by slug
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', req.params.slug)
    .maybeSingle();

  if (error || !page) {
    res.status(404).json({ error: 'Страница не найдена' });
    return;
  }

  res.json(page);
}));

// POST /api/pages — create page (admin)
router.post('/', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = createPageSchema.parse(req.body);

  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      slug: data.slug,
      title: data.title,
      content: data.content,
      meta_description: data.meta_description,
      is_published: data.is_published,
      sort_order: data.sort_order,
    })
    .select()
    .single();

  if (error || !page) {
    res.status(500).json({ error: 'Не удалось создать страницу: ' + error?.message });
    return;
  }

  res.status(201).json(page);
}));

// PUT /api/pages/:id — update page (admin)
router.put('/:id', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = updatePageSchema.parse(req.body);

  const { data: page, error } = await supabase
    .from('pages')
    .update(data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !page) {
    res.status(404).json({ error: 'Страница не найдена или ошибка обновления' });
    return;
  }

  res.json(page);
}));

// DELETE /api/pages/:id — delete page (admin)
router.delete('/:id', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'Страница удалена' });
}));

export default router;
