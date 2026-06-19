import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('mixes')
      .select('id, name, brand, flavor, description, image_url, price, stock_quantity, unit, is_active, status')
      .order('name');

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) { next(e); }
});

router.get('/transactions', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('tobacco_transactions')
      .select('*, mixes(name)')
      .order('created_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) { next(e); }
});

router.get('/low-stock', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('mixes')
      .select('id, name, brand, stock_quantity, unit')
      .lt('stock_quantity', 100)
      .eq('is_active', true)
      .order('stock_quantity');

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) { next(e); }
});

router.post('/purchase', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) { next(e); }
});

router.post('/write-off', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) { next(e); }
});

router.post('/adjust', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) { next(e); }
});

export default router;
