import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/floor-map — Public, returns the published floor map
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('floor_maps')
      .select('tables, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table might not exist yet — return empty
      res.json({ tables: [] });
      return;
    }

    res.json({ tables: data?.tables || [], updatedAt: data?.updated_at });
  } catch (e) { next(e); }
});

// PUT /api/floor-map — Admin only, save and publish floor map
router.put('/', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tables } = req.body;
    if (!Array.isArray(tables)) {
      res.status(400).json({ error: 'tables array is required' });
      return;
    }

    // Deactivate all existing maps
    await supabase
      .from('floor_maps')
      .update({ is_active: false })
      .eq('is_active', true);

    // Upsert the new map (always id=1 for simplicity)
    const { data, error } = await supabase
      .from('floor_maps')
      .upsert({
        id: 'default',
        tables,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[FloorMap] Save error:', error.message);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, tables: data?.tables || tables });
  } catch (e) { next(e); }
});

export default router;
