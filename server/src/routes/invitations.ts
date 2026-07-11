import { Router, Request, Response, NextFunction } from 'express';
import { createInvitationSchema } from '../schemas/invitation.schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { uploadSingle, uploadToSupabase, deleteFromSupabase } from '../middleware/upload';
import { getIO } from '../socket';
import { supabase } from '../config/supabase';
import { logSwallowedError } from '../utils/logError';

const router = Router();

function mapInvitationToFrontend(i: any) {
  if (!i) return null;
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    dateTime: i.date_time,
    location: i.location,
    imageUrl: i.image_url,
    maxParticipants: i.max_participants,
    currentParticipants: i.current_participants,
    status: i.status,
    createdAt: i.created_at,
  };
}

function mapInvitationToDb(body: any) {
  const dbData: any = {};
  if (body.title !== undefined) dbData.title = body.title;
  if (body.description !== undefined) dbData.description = body.description;
  if (body.dateTime !== undefined) dbData.date_time = body.dateTime ? new Date(body.dateTime).toISOString() : undefined;
  if (body.location !== undefined) dbData.location = body.location;
  if (body.imageUrl !== undefined) dbData.image_url = body.imageUrl;
  if (body.maxParticipants !== undefined) {
    dbData.max_participants = body.maxParticipants && body.maxParticipants !== 'null' 
      ? Number(body.maxParticipants) 
      : null;
  }
  if (body.currentParticipants !== undefined) dbData.current_participants = Number(body.currentParticipants);
  if (body.status !== undefined) dbData.status = body.status;
  return dbData;
}

// GET /api/invitations — Public, published only
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('status', 'published')
      .order('date_time', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((invitations || []).map(mapInvitationToFrontend));
  } catch (error) {
    next(error);
  }
});

// GET /api/invitations/all — Auth + Admin, all invitations
router.get('/all', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((invitations || []).map(mapInvitationToFrontend));
  } catch (error) {
    next(error);
  }
});

// GET /api/invitations/:id — Public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !invitation) {
      res.status(404).json({ error: 'Приглашение не найдено', status: 404 });
      return;
    }

    res.json(mapInvitationToFrontend(invitation));
  } catch (error) {
    next(error);
  }
});

// POST /api/invitations — Auth + Admin + upload
router.post(
  '/',
  auth,
  isAdmin,
  uploadSingle('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = createInvitationSchema.parse({
        ...req.body,
        maxParticipants: req.body.maxParticipants
          ? Number(req.body.maxParticipants)
          : undefined,
      });

      const imageUrl = req.file ? await uploadToSupabase(req.file, 'invitations') : undefined;

      const dbData = mapInvitationToDb(parsedData);
      if (imageUrl) dbData.image_url = imageUrl;

      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert(dbData)
        .select()
        .single();

      if (error || !invitation) {
        res.status(500).json({ error: 'Не удалось создать приглашение: ' + error?.message });
        return;
      }

      res.status(201).json(mapInvitationToFrontend(invitation));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/invitations/:id — Auth + Admin + upload
router.put(
  '/:id',
  auth,
  isAdmin,
  uploadSingle('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = createInvitationSchema.partial().parse({
        ...req.body,
        maxParticipants: req.body.maxParticipants
          ? Number(req.body.maxParticipants)
          : undefined,
      });

      const dbData = mapInvitationToDb(parsedData);

      if (req.file) {
        const { data: oldInvitation } = await supabase
          .from('invitations')
          .select('image_url')
          .eq('id', req.params.id)
          .maybeSingle();

        if (oldInvitation?.image_url) {
          await deleteFromSupabase(oldInvitation.image_url);
        }

        dbData.image_url = await uploadToSupabase(req.file, 'invitations');
      }

      // Удаляем undefined значения из объекта обновления
      Object.keys(dbData).forEach(
        (key) => dbData[key] === undefined && delete dbData[key]
      );

      const { data: invitation, error } = await supabase
        .from('invitations')
        .update(dbData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !invitation) {
        res.status(404).json({ error: 'Приглашение не найдено', status: 404 });
        return;
      }

      res.json(mapInvitationToFrontend(invitation));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/invitations/:id/publish — Auth + Admin
router.put(
  '/:id/publish',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .update({ status: 'published' })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !invitation) {
        res.status(404).json({ error: 'Приглашение не найдено', status: 404 });
        return;
      }

      try {
        const io = getIO();
        io.emit('invitation:published', mapInvitationToFrontend(invitation));
      } catch (socketErr) {
        logSwallowedError('invitations:socket-published', socketErr);
      }

      res.json(mapInvitationToFrontend(invitation));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/invitations/:id — Auth + Admin
router.delete(
  '/:id',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('image_url')
        .eq('id', req.params.id)
        .maybeSingle();

      if (fetchError || !invitation) {
        res.status(404).json({ error: 'Приглашение не найдено', status: 404 });
        return;
      }

      if (invitation.image_url) {
        await deleteFromSupabase(invitation.image_url);
      }

      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', req.params.id);

      if (deleteError) {
        res.status(500).json({ error: deleteError.message });
        return;
      }

      res.json({ message: 'Приглашение удалено' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
