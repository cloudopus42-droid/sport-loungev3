import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import { createInventorySchema, updateInventorySchema } from '../schemas/inventory.schema';
import { asyncHandler } from '../utils/http';

const router = Router();

// GET /api/inventory — list all inventory items
router.get('/', auth, isAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const { data: items, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(items || []);
}));

// POST /api/inventory — create inventory item
router.post('/', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = createInventorySchema.parse(req.body);

  const { data: item, error } = await supabase
    .from('inventory')
    .insert({
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      min_stock: data.min_stock,
      price: data.price,
      supplier: data.supplier,
      notes: data.notes,
    })
    .select()
    .single();

  if (error || !item) {
    res.status(500).json({ error: 'Не удалось создать позицию: ' + error?.message });
    return;
  }

  res.status(201).json(item);
}));

// PUT /api/inventory/:id — update inventory item
router.put('/:id', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = updateInventorySchema.parse(req.body);

  const { data: item, error } = await supabase
    .from('inventory')
    .update(data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !item) {
    res.status(404).json({ error: 'Позиция не найдена или ошибка обновления' });
    return;
  }

  res.json(item);
}));

// DELETE /api/inventory/:id — delete inventory item
router.delete('/:id', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'Позиция удалена' });
}));

export default router;
