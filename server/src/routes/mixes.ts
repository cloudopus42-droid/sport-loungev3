import { Router, Request, Response } from 'express';
import { createMixSchema } from '../schemas/mix.schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import { asyncHandler } from '../utils/http';

const router = Router();

function mapMixToFrontend(m: any) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    manufacturer: m.manufacturer,
    description: m.description,
    flavors: m.flavors || [],
    strength: m.strength,
    status: m.status,
    createdAt: m.created_at,
  };
}

// GET /api/mixes/user-mixes — Auth (current user's saved mixes)
router.get('/user-mixes', auth, asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('user_mixes')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      res.json([]);
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data || []);
}));

// POST /api/mixes/user-mixes — Auth (save a mix for current user)
router.post('/user-mixes', auth, asyncHandler(async (req: Request, res: Response) => {
  const { name, flavors, percentages, strength, notes } = req.body;
  if (!name || !flavors) {
    res.status(400).json({ error: 'name and flavors are required' });
    return;
  }
  const { data, error } = await supabase
    .from('user_mixes')
    .insert({
      user_id: req.user!.id,
      name,
      flavors: Array.isArray(flavors) ? flavors : [flavors],
      percentages: percentages || {},
      strength: strength || 'medium',
      notes: notes || '',
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      res.status(400).json({ error: 'Таблица user_mixes не создана в базе данных' });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
}));

// DELETE /api/mixes/user-mixes/:id — Auth (delete own saved mix)
router.delete('/user-mixes/:id', auth, asyncHandler(async (req: Request, res: Response) => {
  const { data: mix, error: fetchErr } = await supabase
    .from('user_mixes')
    .select('id, user_id')
    .eq('id', req.params.id)
    .maybeSingle();

  if (fetchErr || !mix) {
    res.status(404).json({ error: 'Микс не найден' });
    return;
  }
  if (mix.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Это не ваш микс' });
    return;
  }

  const { error: delErr } = await supabase
    .from('user_mixes')
    .delete()
    .eq('id', req.params.id);

  if (delErr) {
    res.status(500).json({ error: delErr.message });
    return;
  }
  res.json({ success: true });
}));

// GET /api/mixes — Public
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const { data: mixes, error } = await supabase
    .from('mixes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json((mixes || []).map(mapMixToFrontend));
}));

// GET /api/mixes/:id — Public
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { data: mix, error } = await supabase
    .from('mixes')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error || !mix) {
    res.status(404).json({ error: 'Микс не найден', status: 404 });
    return;
  }

  res.json(mapMixToFrontend(mix));
}));

// POST /api/mixes — Auth + Admin
router.post(
  '/',
  auth,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = createMixSchema.parse(req.body);

    const { data: mix, error } = await supabase
      .from('mixes')
      .insert({
        name: data.name,
        manufacturer: data.manufacturer,
        description: data.description || '',
        flavors: data.flavors || [],
        strength: data.strength || 5,
        status: data.status || 'active',
      })
      .select()
      .single();

    if (error || !mix) {
      res.status(500).json({ error: 'Не удалось создать микс: ' + error?.message });
      return;
    }

    res.status(201).json(mapMixToFrontend(mix));
  })
);

// PUT /api/mixes/:id — Auth + Admin
router.put(
  '/:id',
  auth,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = createMixSchema.partial().parse(req.body);

    const { data: mix, error } = await supabase
      .from('mixes')
      .update(data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !mix) {
      res.status(404).json({ error: 'Микс не найден', status: 404 });
      return;
    }

    res.json(mapMixToFrontend(mix));
  })
);

// DELETE /api/mixes/:id — Auth + Admin
router.delete(
  '/:id',
  auth,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: mix, error } = await supabase
      .from('mixes')
      .delete()
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !mix) {
      res.status(404).json({ error: 'Микс не найден', status: 404 });
      return;
    }

    res.json({ message: 'Микс удалён' });
  })
);

export default router;
