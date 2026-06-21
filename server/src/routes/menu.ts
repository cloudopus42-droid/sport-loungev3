import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import { createMenuSchema, updateMenuSchema } from '../schemas/menu.schema';

const router = Router();

// GET /api/menu — public, available items sorted by sort_order
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(items || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/menu — create menu item (admin)
router.post('/', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createMenuSchema.parse(req.body);

    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price,
        image_url: data.image_url,
        is_available: data.is_available,
        sort_order: data.sort_order,
      })
      .select()
      .single();

    if (error || !item) {
      res.status(500).json({ error: 'Не удалось создать элемент меню: ' + error?.message });
      return;
    }

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/menu/:id — update menu item (admin)
router.put('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateMenuSchema.parse(req.body);

    const { data: item, error } = await supabase
      .from('menu_items')
      .update(data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !item) {
      res.status(404).json({ error: 'Элемент не найден или ошибка обновления' });
      return;
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/menu/:id — delete menu item (admin)
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Элемент меню удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
