import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import { getPagination, paginatedResponse } from '../utils/pagination';
import { z } from 'zod';

const router = Router();

const updateUserSchema = z.object({
  personal_price: z.number().int().min(0).max(10000).nullable().optional(),
  is_blocked: z.boolean().optional(),
  admin_note: z.string().max(1000).nullable().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

function mapUserToFrontend(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    avatar: u.avatar || u.avatar_url || null,
    phone: u.phone || null,
    bio: u.bio || null,
    personalPrice: u.personal_price ?? null,
    isBlocked: u.is_blocked ?? false,
    adminNote: u.admin_note || null,
    createdAt: u.created_at,
  };
}

// GET /api/users - List users (admin only)
router.get('/', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role } = req.query;

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const pag = getPagination(req, 50);

    let query = supabase
      .from('users')
      .select('id, email, name, role, avatar, avatar_url, phone, personal_price, is_blocked, admin_note, created_at')
      .range(pag.offset, pag.offset + pag.limit - 1);

    const roleMap: Record<string, string> = { client: 'user', user: 'user', admin: 'admin' };
    const dbRole = role && typeof role === 'string' ? roleMap[role.toLowerCase()] : null;
    if (dbRole) {
      query = query.eq('role', dbRole);
    }

    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: users, error } = await query.order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const mapped = (users || []).map(mapUserToFrontend);
    res.json(paginatedResponse(mapped, count, pag));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get user detail with order history (admin only)
router.get('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, name, role, avatar, avatar_url, phone, bio, personal_price, is_blocked, admin_note, created_at')
      .eq('id', req.params.id)
      .maybeSingle();

    if (userErr || !user) {
      res.status(404).json({ error: 'Пользователь не найден', status: 404 });
      return;
    }

    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.params.id);

    const pag = getPagination(req, 20, 50);
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, liquid_id, notes, price, seat_label, created_at, rating')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(pag.offset, pag.offset + pag.limit - 1);

    res.json({
      user: mapUserToFrontend(user),
      orders: {
        items: orders || [],
        total: count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - Update user (admin only)
router.patch('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const updates: any = {};

    if (data.personal_price !== undefined) updates.personal_price = data.personal_price;
    if (data.is_blocked !== undefined) updates.is_blocked = data.is_blocked;
    if (data.admin_note !== undefined) updates.admin_note = data.admin_note;
    if (data.role !== undefined) updates.role = data.role;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Нет данных для обновления', status: 400 });
      return;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, name, role, avatar, avatar_url, phone, personal_price, is_blocked, admin_note, created_at')
      .maybeSingle();

    if (updateErr || !updated) {
      res.status(500).json({ error: 'Не удалось обновить пользователя: ' + (updateErr?.message || 'Неизвестная ошибка') });
      return;
    }

    res.json(mapUserToFrontend(updated));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/orders - Get user orders (admin only)
router.get('/:id/orders', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pag = getPagination(req, 20, 50);
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.params.id);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, liquid_id, notes, price, seat_label, seat_zone, created_at, rating, rating_comment')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(pag.offset, pag.offset + pag.limit - 1);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(paginatedResponse(orders || [], count, pag));
  } catch (err) {
    next(err);
  }
});

export default router;
