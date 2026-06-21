import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

const createSchema = z.object({
  tobacco_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'completed', 'rejected']),
  notes: z.string().optional(),
});

router.get('/requests', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('restock_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) { next(e); }
});

router.post('/requests', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const { tobacco_id, quantity, notes } = parsed.data;

    const { data: tobacco, error: fetchError } = await supabase
      .from('mixes')
      .select('id, name')
      .eq('id', tobacco_id)
      .single();

    if (fetchError || !tobacco) {
      res.status(404).json({ error: 'Tobacco not found' });
      return;
    }

    const { data, error } = await supabase
      .from('restock_requests')
      .insert({
        tobacco_id,
        tobacco_name: tobacco.name,
        quantity,
        status: 'pending',
        notes: notes || '',
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put('/requests/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const { status, notes } = parsed.data;

    if (status === 'approved') {
      const { data: request, error: fetchError } = await supabase
        .from('restock_requests')
        .select('tobacco_id, quantity')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      const { data: mix, error: mixError } = await supabase
        .from('mixes')
        .select('stock_quantity')
        .eq('id', request.tobacco_id)
        .single();

      if (mixError || !mix) {
        res.status(404).json({ error: 'Tobacco mix not found' });
        return;
      }

      const { error: updateError } = await supabase
        .from('mixes')
        .update({
          stock_quantity: (mix.stock_quantity || 0) + request.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.tobacco_id);

      if (updateError) { res.status(500).json({ error: updateError.message }); return; }
    }

    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('restock_requests')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) { next(e); }
});

// POST /api/restock/check — Auto-check stock and create restock requests
router.post('/check', auth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('mixes')
      .select('id, name, stock_quantity, min_stock_threshold, auto_reorder_enabled');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const lowStock = (data || []).filter(
      (item) => item.stock_quantity <= (item.min_stock_threshold ?? 5) && item.auto_reorder_enabled === true
    );

    let createdCount = 0;
    if (lowStock.length > 0) {
      const requests = lowStock.map((item) => ({
        tobacco_id: item.id,
        tobacco_name: item.name,
        quantity: Math.max(10, (item.min_stock_threshold ?? 5) * 2),
        status: 'pending' as const,
      }));

      const { error: insertError } = await supabase
        .from('restock_requests')
        .insert(requests);

      if (!insertError) {
        createdCount = requests.length;
      }
    }

    res.json({ created: createdCount, total_low_stock: lowStock.length });
  } catch (e) { next(e); }
});

router.get('/low-stock', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('mixes')
      .select('id, name, brand, flavor, stock_quantity, min_stock_threshold, auto_reorder_enabled')
      .order('stock_quantity');

    if (error) { res.status(500).json({ error: error.message }); return; }
    const lowStock = (data || []).filter(
      (item) => item.stock_quantity < (item.min_stock_threshold ?? 5)
    );
    res.json(lowStock);
  } catch (e) { next(e); }
});

export default router;
