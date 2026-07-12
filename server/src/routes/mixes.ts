import { Router, Request, Response, NextFunction } from 'express';
import { createMixSchema } from '../schemas/mix.schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

function mapMixToFrontend(m: any) {
  if (!m) return null;
  return {
    id: m.id,
    _id: m.id,
    name: m.name,
    manufacturer: m.manufacturer,
    description: m.description,
    flavors: m.flavors || [],
    strength: m.strength,
    status: m.status,
    emoji: m.emoji || '',
    category: m.category || 'Основные',
    color: m.color || '',
    createdAt: m.created_at,
  };
}

// GET /api/mixes/user-mixes — Auth (current user's saved mixes)
router.get('/user-mixes', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) { next(e); }
});

// POST /api/mixes/user-mixes — Auth (save a mix for current user)
router.post('/user-mixes', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) { next(e); }
});

// DELETE /api/mixes/user-mixes/:id — Auth (delete own saved mix)
router.delete('/user-mixes/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) { next(e); }
});

// GET /api/mixes — Public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: mixes, error } = await supabase
      .from('mixes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((mixes || []).map(mapMixToFrontend));
  } catch (error) {
    next(error);
  }
});

// GET /api/mixes/:id — Public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// POST /api/mixes — Auth + Admin
router.post(
  '/',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
          emoji: data.emoji || '',
          category: data.category || 'Основные',
          color: data.color || '',
        })
        .select()
        .single();

      if (error || !mix) {
        res.status(500).json({ error: 'Не удалось создать микс: ' + error?.message });
        return;
      }

      res.status(201).json(mapMixToFrontend(mix));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/mixes/:id — Auth + Admin
router.put(
  '/:id',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/mixes/:id — Auth + Admin
router.delete(
  '/:id',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

export default router;
