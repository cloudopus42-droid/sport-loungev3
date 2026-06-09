import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

function mapShowcaseToFrontend(s: any) {
  if (!s) return null;
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    imageUrl: s.image_url,
    order: s.sort_order,
    isActive: s.is_active,
    createdAt: s.created_at,
  };
}

function mapShowcaseToDb(body: any) {
  const dbData: any = {};
  if (body.title !== undefined) dbData.title = body.title;
  if (body.description !== undefined) dbData.description = body.description;
  if (body.imageUrl !== undefined) dbData.image_url = body.imageUrl;
  if (body.order !== undefined) dbData.sort_order = Number(body.order);
  if (body.isActive !== undefined) dbData.is_active = Boolean(body.isActive);
  return dbData;
}

// GET /api/showcases — public, active showcases sorted by order
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: items, error } = await supabase
      .from('showcases')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((items || []).map(mapShowcaseToFrontend));
  } catch (e) {
    next(e);
  }
});

// POST /api/showcases — admin
router.post('/', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbData = mapShowcaseToDb(req.body);

    const { data: item, error } = await supabase
      .from('showcases')
      .insert(dbData)
      .select()
      .single();

    if (error || !item) {
      res.status(500).json({ error: 'Не удалось создать элемент витрины: ' + error?.message });
      return;
    }

    res.status(201).json(mapShowcaseToFrontend(item));
  } catch (e) {
    next(e);
  }
});

// PUT /api/showcases/:id — admin
router.put('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbData = mapShowcaseToDb(req.body);

    const { data: item, error } = await supabase
      .from('showcases')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !item) {
      res.status(404).json({ error: 'Не найдено или ошибка обновления' });
      return;
    }

    res.json(mapShowcaseToFrontend(item));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/showcases/:id — admin
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('showcases')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Удалено' });
  } catch (e) {
    next(e);
  }
});

export default router;
