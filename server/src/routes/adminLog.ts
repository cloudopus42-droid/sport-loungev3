import { Router } from 'express';
import { supabase } from '../config/supabase';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.get('/', auth, isAdmin, async (_req, res) => {
  const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100);
  res.json(data || []);
});

router.post('/', auth, isAdmin, async (req, res) => {
  const { action, details, level } = req.body;
  const { data, error } = await supabase.from('admin_logs').insert({
    user_id: req.user!.id,
    action,
    details,
    level: level || 'info'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
