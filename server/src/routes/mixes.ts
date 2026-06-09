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
    name: m.name,
    manufacturer: m.manufacturer,
    description: m.description,
    flavors: m.flavors || [],
    strength: m.strength,
    status: m.status,
    createdAt: m.created_at,
  };
}

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
