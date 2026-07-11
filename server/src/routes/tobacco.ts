import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { uploadSingle, uploadToSupabase, deleteFromSupabase } from '../middleware/upload';
import { supabase } from '../config/supabase';
import { asyncHandler } from '../utils/http';

function mapItem(item: any) {
  if (!item) return item;
  return {
    ...item,
    brand: item.brand || item.manufacturer || '',
    flavor: item.flavor || (Array.isArray(item.flavors) ? item.flavors[0] : item.flavors) || '',
  };
}

const createTobaccoSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  flavor: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  price: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  unit: z.string().optional(),
  weight_grams: z.coerce.number().int().min(0).optional(),
  is_active: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  status: z.string().optional(),
  min_stock_threshold: z.coerce.number().int().min(0).default(5),
  auto_reorder_enabled: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

const router = Router();

router.get('/flavors', asyncHandler(async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('mixes')
    .select('id, name, flavor, is_active, price')
    .eq('is_active', true)
    .order('name');

  if (error) {
    const { data: fallback, error: fbErr } = await supabase
      .from('mixes')
      .select('id, name, flavors, is_active, price')
      .eq('is_active', true)
      .order('name');
    if (fbErr) { res.json([]); return; }
    const flattened = (fallback || []).flatMap((m: any) => {
      const arr = Array.isArray(m.flavors) ? m.flavors : [m.flavors].filter(Boolean);
      return arr.map((f: string) => ({ id: `${m.id}-${f}`, name: f, category: 'Основные', is_active: true, price_value: m.price }));
    });
    res.json(flattened);
    return;
  }

  const flavors = (data || []).map((m: any) => ({
    id: m.id, name: m.flavor || m.name, category: 'Основные',
    is_active: m.is_active !== false, price_value: m.price,
  }));
  res.json(flavors);
}));

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('mixes')
    .select('id, name, brand, flavor, description, image_url, price, stock_quantity, unit, weight_grams, is_active, status, min_stock_threshold, auto_reorder_enabled')
    .order('name');

  if (error) {
    if (error.message?.includes('stock_quantity') || error.message?.includes('does not exist')) {
      const { data: fallback, error: fbErr } = await supabase
        .from('mixes')
        .select('id, name, manufacturer, description, flavors, strength, status, created_at')
        .order('name');
      if (fbErr) { res.status(500).json({ error: fbErr.message }); return; }
      res.json((fallback || []).map(mapItem));
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data || []).map(mapItem));
}));

router.get('/transactions', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('tobacco_transactions')
    .select('*, mixes(name)')
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data || []);
}));

router.get('/low-stock', auth, isAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('mixes')
    .select('id, name, brand, stock_quantity, unit')
    .lt('stock_quantity', 100)
    .eq('is_active', true)
    .order('stock_quantity');

  if (error) {
    res.json([]);
    return;
  }
  res.json(data || []);
}));

router.post('/purchase', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { mix_id, quantity, price, notes } = req.body;
  if (!mix_id || !quantity) {
    res.status(400).json({ error: 'mix_id and quantity required' });
    return;
  }

  const { data: mix, error: fetchError } = await supabase
    .from('mixes')
    .select('stock_quantity')
    .eq('id', mix_id)
    .single();
  if (fetchError || !mix) {
    res.status(404).json({ error: 'Mix not found' });
    return;
  }

  const { error: txError } = await supabase.from('tobacco_transactions').insert({
    mix_id, type: 'purchase', quantity, unit: 'gram', price: price || 0,
    notes: notes || '', performed_by: req.user!.id,
  });
  if (txError) { res.status(500).json({ error: txError.message }); return; }

  const { error: updateError } = await supabase
    .from('mixes')
    .update({ stock_quantity: (mix.stock_quantity || 0) + quantity, updated_at: new Date().toISOString() })
    .eq('id', mix_id);
  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  res.json({ success: true });
}));

router.post('/write-off', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { mix_id, quantity, notes } = req.body;
  if (!mix_id || !quantity) {
    res.status(400).json({ error: 'mix_id and quantity required' });
    return;
  }

  const { data: mix, error: fetchError } = await supabase
    .from('mixes')
    .select('stock_quantity')
    .eq('id', mix_id)
    .single();
  if (fetchError || !mix) {
    res.status(404).json({ error: 'Mix not found' });
    return;
  }

  const newStock = (mix.stock_quantity || 0) - quantity;
  if (newStock < 0) {
    res.status(400).json({ error: 'Insufficient stock' });
    return;
  }

  const { error: txError } = await supabase.from('tobacco_transactions').insert({
    mix_id, type: 'write-off', quantity: -quantity, unit: 'gram',
    notes: notes || '', performed_by: req.user!.id,
  });
  if (txError) { res.status(500).json({ error: txError.message }); return; }

  const { error: updateError } = await supabase
    .from('mixes')
    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq('id', mix_id);
  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  res.json({ success: true });
}));

router.post('/adjust', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { mix_id, quantity, notes } = req.body;
  if (!mix_id || quantity === undefined) {
    res.status(400).json({ error: 'mix_id and quantity required' });
    return;
  }

  const { error: txError } = await supabase.from('tobacco_transactions').insert({
    mix_id, type: 'adjustment', quantity, unit: 'gram',
    notes: notes || '', performed_by: req.user!.id,
  });
  if (txError) { res.status(500).json({ error: txError.message }); return; }

  const { error: updateError } = await supabase
    .from('mixes')
    .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
    .eq('id', mix_id);
  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  res.json({ success: true });
}));

router.post('/', auth, isAdmin, uploadSingle('image'), asyncHandler(async (req: Request, res: Response) => {
  const data = createTobaccoSchema.parse(req.body);
  let imageUrl = data.image_url;
  if (req.file) {
    imageUrl = await uploadToSupabase(req.file, 'tobacco');
  }

  const record: Record<string, unknown> = {
    name: data.name,
    description: data.description || '',
    status: data.status || 'active',
  };

  const extra = {
    brand: data.brand || null,
    flavor: data.flavor || null,
    image_url: imageUrl || null,
    price: data.price || 0,
    stock_quantity: data.stock_quantity,
    unit: data.unit || 'gram',
    weight_grams: data.weight_grams,
    is_active: data.is_active ?? true,
    min_stock_threshold: data.min_stock_threshold,
    auto_reorder_enabled: data.auto_reorder_enabled ?? false,
  };

  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) record[k] = v;
  }

  const { data: item, error } = await supabase
    .from('mixes')
    .insert(record)
    .select()
    .single();

  if (error) {
    if (error.message?.includes('does not exist')) {
      const base = { name: data.name, description: data.description || '', status: data.status || 'active' };
      const { data: fb, error: fbErr } = await supabase
        .from('mixes')
        .insert(base)
        .select()
        .single();
      if (fbErr || !fb) {
        res.status(500).json({ error: 'Не удалось создать: ' + fbErr?.message });
        return;
      }
      res.status(201).json(fb);
      return;
    }
    res.status(500).json({ error: 'Не удалось создать: ' + error.message });
    return;
  }
  res.status(201).json(item);
}));

router.put('/:id', auth, isAdmin, uploadSingle('image'), asyncHandler(async (req: Request, res: Response) => {
  const data = createTobaccoSchema.partial().parse(req.body);
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.brand !== undefined) updateData.brand = data.brand || null;
  if (data.flavor !== undefined) updateData.flavor = data.flavor || null;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.weight_grams !== undefined) updateData.weight_grams = data.weight_grams;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.min_stock_threshold !== undefined) updateData.min_stock_threshold = data.min_stock_threshold;
  if (data.auto_reorder_enabled !== undefined) updateData.auto_reorder_enabled = data.auto_reorder_enabled;

  if (req.file) {
    const { data: oldItem } = await supabase
      .from('mixes')
      .select('image_url')
      .eq('id', req.params.id)
      .maybeSingle();

    if (oldItem?.image_url) {
      await deleteFromSupabase(oldItem.image_url);
    }
    updateData.image_url = await uploadToSupabase(req.file, 'tobacco');
  } else if (data.image_url !== undefined) {
    updateData.image_url = data.image_url || null;
  }

  updateData.updated_at = new Date().toISOString();

  const { data: item, error } = await supabase
    .from('mixes')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (error.message?.includes('does not exist')) {
      const safeUpdate: Record<string, unknown> = {};
      const safeKeys = ['name', 'description', 'status'];
      for (const k of safeKeys) {
        if (updateData[k] !== undefined) safeUpdate[k] = updateData[k];
      }
      safeUpdate.updated_at = updateData.updated_at;
      const { data: fb, error: fbErr } = await supabase
        .from('mixes')
        .update(safeUpdate)
        .eq('id', req.params.id)
        .select()
        .single();
      if (fbErr || !fb) {
        res.status(404).json({ error: 'Не найдено' });
        return;
      }
      res.json(fb);
      return;
    }
    res.status(404).json({ error: 'Не найдено' });
    return;
  }
  res.json(item);
}));

router.delete('/:id', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { data: item, error: fetchError } = await supabase
    .from('mixes')
    .select('image_url')
    .eq('id', req.params.id)
    .maybeSingle();

  if (fetchError || !item) {
    res.status(404).json({ error: 'Не найдено' });
    return;
  }

  if (item.image_url) {
    await deleteFromSupabase(item.image_url);
  }

  const { error: deleteError } = await supabase
    .from('mixes')
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    res.status(500).json({ error: deleteError.message });
    return;
  }
  res.json({ message: 'Удалено' });
}));

router.get('/stock', auth, isAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('mixes')
    .select('id, name, brand, flavor, stock_quantity, min_stock_threshold, auto_reorder_enabled')
    .order('name');

  if (error) {
    const { data: fallback, error: fbErr } = await supabase
      .from('mixes')
      .select('id, name, manufacturer, flavors')
      .order('name');
    if (fbErr) { res.status(500).json({ error: fbErr.message }); return; }
    res.json((fallback || []).map((f: any) => ({
      id: f.id, name: f.name,
      brand: f.brand || f.manufacturer || '',
      flavor: f.flavor || (Array.isArray(f.flavors) ? f.flavors[0] : f.flavors) || '',
      stock_quantity: 0,
      min_stock_threshold: null,
      auto_reorder_enabled: false,
    })));
    return;
  }
  res.json((data || []).map(mapItem));
}));

router.put('/:id/stock', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
    res.status(400).json({ error: 'quantity must be a non-negative number' });
    return;
  }

  const { error: updateError } = await supabase
    .from('mixes')
    .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
    .eq('id', req.params.id);

  if (updateError) {
    if (updateError.message?.includes('does not exist')) {
      res.status(400).json({ error: 'Управление остатками недоступно: выполните миграцию БД' });
      return;
    }
    res.status(500).json({ error: updateError.message });
    return;
  }
  res.json({ success: true });
}));

router.put('/:id/threshold', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { min_stock_threshold, auto_reorder_enabled } = req.body;
  if (min_stock_threshold === undefined || typeof min_stock_threshold !== 'number' || min_stock_threshold < 0) {
    res.status(400).json({ error: 'min_stock_threshold must be a non-negative number' });
    return;
  }

  const updateData: Record<string, unknown> = {
    min_stock_threshold,
    updated_at: new Date().toISOString(),
  };
  if (typeof auto_reorder_enabled === 'boolean') {
    updateData.auto_reorder_enabled = auto_reorder_enabled;
  }

  const { error: updateError } = await supabase
    .from('mixes')
    .update(updateData)
    .eq('id', req.params.id);

  if (updateError) { res.status(500).json({ error: updateError.message }); return; }
  res.json({ success: true });
}));

export default router;
