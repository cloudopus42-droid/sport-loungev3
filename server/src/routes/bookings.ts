import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { sendBookingNotification } from '../services/telegram';
import { z } from 'zod';
import { supabase } from '../config/supabase';

const router = Router();

const createBookingSchema = z.object({
  seatId: z.string().min(1),
  seatLabel: z.string().min(1),
  seatZone: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  guestsCount: z.number().int().min(1).max(20),
  phone: z.string().min(5),
  hookahMix: z.string().min(1),
  hookahStrength: z.enum(['light', 'medium', 'strong']).default('medium'),
  hookahCount: z.number().int().min(1).max(10).default(1),
  comment: z.string().max(500).optional(),
});

function mapBookingToFrontend(b: any) {
  if (!b) return null;

  // Если был присоединен пользователь
  let mappedUser = b.user;
  if (b.user_id && typeof b.user_id === 'object') {
    mappedUser = {
      id: b.user_id.id,
      name: b.user_id.name,
      email: b.user_id.email,
      avatar: b.user_id.avatar,
      phone: b.user_id.phone
    };
  } else if (b.user && typeof b.user === 'object') {
    mappedUser = {
      id: b.user.id || b.user_id,
      name: b.user.name,
      email: b.user.email,
      avatar: b.user.avatar,
      phone: b.user.phone
    };
  }

  return {
    id: b.id,
    user: mappedUser || b.user_id,
    seatId: b.seat_id,
    seatLabel: b.seat_label,
    seatZone: b.seat_zone,
    date: b.date,
    time: b.time,
    guestsCount: b.guests_count,
    phone: b.phone,
    hookahMix: b.hookah_mix,
    hookahStrength: b.hookah_strength,
    hookahCount: b.hookah_count,
    hookahStatus: b.hookah_status,
    hookahStatusUpdatedAt: b.hookah_status_updated_at,
    comment: b.comment,
    status: b.status,
    createdAt: b.created_at,
  };
}

// POST /api/bookings — Create booking (authenticated)
router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Проверяем, забронировано ли уже место на эту дату и время
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('seat_id', data.seatId)
      .eq('date', data.date)
      .eq('time', data.time)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'Это место уже забронировано на выбранное время', status: 409 });
      return;
    }

    // Создаем бронь в БД
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user!.id,
        seat_id: data.seatId,
        seat_label: data.seatLabel,
        seat_zone: data.seatZone,
        date: data.date,
        time: data.time,
        guests_count: data.guestsCount,
        phone: data.phone,
        hookah_mix: data.hookahMix,
        hookah_strength: data.hookahStrength,
        hookah_count: data.hookahCount,
        comment: data.comment || '',
        status: 'pending',
        hookah_status: 'accepted',
        hookah_status_updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !booking) {
      res.status(500).json({ error: 'Не удалось создать бронирование: ' + insertError?.message });
      return;
    }

    // Получаем информацию о пользователе для нотификации и ответа
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, avatar, phone')
      .eq('id', req.user!.id)
      .single();

    if (user) {
      sendBookingNotification({
        seatLabel: data.seatLabel,
        seatZone: data.seatZone,
        date: data.date,
        time: data.time,
        guestsCount: data.guestsCount,
        phone: data.phone,
        userName: user.name,
        userEmail: user.email,
        hookahMix: data.hookahMix,
        hookahStrength: data.hookahStrength,
        hookahCount: data.hookahCount,
        comment: data.comment,
      }).catch(() => {});
    }

    const populated = { ...booking, user };
    res.status(201).json(mapBookingToFrontend(populated));
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/my — My bookings (authenticated)
router.get('/my', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((bookings || []).map(mapBookingToFrontend));
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/date/:date — Bookings for a date (for checking availability)
router.get('/date/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.params;
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('seat_id, time, status')
      .eq('date', date)
      .neq('status', 'cancelled');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Сопоставляем имена полей
    const mapped = (bookings || []).map((b) => ({
      seatId: b.seat_id,
      time: b.time,
      status: b.status,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/all — All bookings (admin)
router.get('/all', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, status } = req.query;
    let query = supabase
      .from('bookings')
      .select('*, user:user_id(id, name, email, avatar, phone)');

    if (date) {
      query = query.eq('date', date);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((bookings || []).map(mapBookingToFrontend));
  } catch (error) {
    next(error);
  }
});

// PUT /api/bookings/:id/status — Update status (admin)
router.put(
  '/:id/status',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!['confirmed', 'cancelled'].includes(status)) {
        res.status(400).json({ error: 'Неверный статус', status: 400 });
        return;
      }

      const updates: any = { status };
      if (status === 'confirmed') {
        updates.hookah_status_updated_at = new Date().toISOString();
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', req.params.id)
        .select('*, user:user_id(id, name, email, avatar, phone)')
        .single();

      if (error || !booking) {
        res.status(404).json({ error: 'Бронь не найдена', status: 404 });
        return;
      }

      res.json(mapBookingToFrontend(booking));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/bookings/:id — Cancel booking (owner or admin)
router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Получаем саму бронь
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, status')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchError || !booking) {
      res.status(404).json({ error: 'Бронь не найдена', status: 404 });
      return;
    }

    // Проверяем права на отмену (только создатель или админ)
    if (booking.user_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Нет доступа', status: 403 });
      return;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id);

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    res.json({ message: 'Бронь отменена' });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id/hookah-status — Public hookah status with progress
router.get('/:id/hookah-status', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, status, created_at, hookah_status, hookah_status_updated_at')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !booking) {
      res.status(404).json({ error: 'Заказ не найден' });
      return;
    }

    const status = getHookahStatusByTime(mapBookingToFrontend(booking));

    res.json({
      hookahStatus: status.status,
      hookahStatusLabel: status.label,
      progressPercent: status.progress,
      minutesLeft: status.minutesLeft,
    });
  } catch (error) {
    next(error);
  }
});

// Helper: calculate hookah status based on elapsed time since booking was confirmed
function getHookahStatusByTime(booking: any): {
  status: string;
  label: string;
  progress: number;
  minutesLeft: number;
} {
  const startTime = new Date(booking.hookahStatusUpdatedAt || booking.createdAt).getTime();
  const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
  const totalMinutes = 10;

  if (booking.status === 'cancelled') {
    return { status: 'cancelled', label: 'Отменён', progress: 0, minutesLeft: 0 };
  }

  if (elapsed < 2.5) {
    return {
      status: 'accepted',
      label: 'Заказ принят',
      progress: Math.round((elapsed / totalMinutes) * 100),
      minutesLeft: Math.ceil(totalMinutes - elapsed),
    };
  } else if (elapsed < 5) {
    return {
      status: 'heating',
      label: 'Угли горят',
      progress: Math.round((elapsed / totalMinutes) * 100),
      minutesLeft: Math.ceil(totalMinutes - elapsed),
    };
  } else if (elapsed < 8) {
    return {
      status: 'almost',
      label: 'Почти готово',
      progress: Math.round((elapsed / totalMinutes) * 100),
      minutesLeft: Math.ceil(totalMinutes - elapsed),
    };
  } else {
    return {
      status: 'ready',
      label: 'Готово! 🔥',
      progress: 100,
      minutesLeft: 0,
    };
  }
}

export default router;
