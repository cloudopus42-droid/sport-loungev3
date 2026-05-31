import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

// Дефолтная конфигурация столов (если еще нет в БД)
const DEFAULT_SEATS = [
  { id: 'vip-1', label: 'VIP 1', zone: 'vip' as const, x: 5, y: 12, width: 22, height: 18, capacity: 8 },
  { id: 'vip-2', label: 'VIP 2', zone: 'vip' as const, x: 5, y: 40, width: 22, height: 18, capacity: 6 },
  { id: 'vip-3', label: 'VIP 3', zone: 'vip' as const, x: 5, y: 68, width: 22, height: 18, capacity: 6 },
  { id: 'table-1', label: 'Стол 1', zone: 'regular' as const, x: 35, y: 10, width: 14, height: 14, capacity: 4 },
  { id: 'table-2', label: 'Стол 2', zone: 'regular' as const, x: 54, y: 10, width: 14, height: 14, capacity: 4 },
  { id: 'table-3', label: 'Стол 3', zone: 'regular' as const, x: 35, y: 32, width: 14, height: 14, capacity: 4 },
  { id: 'table-4', label: 'Стол 4', zone: 'regular' as const, x: 54, y: 32, width: 14, height: 14, capacity: 4 },
  { id: 'table-5', label: 'Стол 5', zone: 'regular' as const, x: 35, y: 55, width: 14, height: 14, capacity: 2 },
  { id: 'table-6', label: 'Стол 6', zone: 'regular' as const, x: 54, y: 55, width: 14, height: 14, capacity: 2 },
  { id: 'bar-1', label: 'Бар 1', zone: 'bar' as const, x: 76, y: 20, width: 18, height: 12, capacity: 2 },
  { id: 'bar-2', label: 'Бар 2', zone: 'bar' as const, x: 76, y: 45, width: 18, height: 12, capacity: 2 },
];

// GET / — public, get current seat config
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: config, error } = await supabase
      .from('seat_configs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!config) {
      res.json({ seats: DEFAULT_SEATS });
      return;
    }
    res.json({ seats: config.seats });
  } catch (e) {
    next(e);
  }
});

// PUT / — admin, save seat config
router.put('/', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seats } = req.body;
    if (!Array.isArray(seats)) {
      res.status(400).json({ error: 'seats must be an array' });
      return;
    }

    // Проверяем, есть ли уже какая-то конфигурация в БД
    const { data: current } = await supabase
      .from('seat_configs')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;

    if (current) {
      const { data, error } = await supabase
        .from('seat_configs')
        .update({
          seats,
          updated_by: req.user!.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', current.id)
        .select()
        .single();
      
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from('seat_configs')
        .insert({
          seats,
          updated_by: req.user!.id
        })
        .select()
        .single();
      
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      result = data;
    }

    res.json({ seats: result ? result.seats : [] });
  } catch (e) {
    next(e);
  }
});

export default router;
