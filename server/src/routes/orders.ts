import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import { config } from '../config/env';
import { getIO } from '../socket';
import { z } from 'zod';
import { getPagination, paginatedResponse } from '../utils/pagination';
import { 
  sendOrderNotification, 
  sendMasterCallNotification, 
  sendDelayNotification 
} from '../services/ordersTelegram';
import { sendStatusNotification } from '../services/telegram';

const router = Router();

const createOrderSchema = z.object({
  mix_id: z.string().uuid().nullable().optional(),
  liquid_id: z.string().min(1).optional().default('water'),
  notes: z.string().max(500).optional().default(''),
  seat_id: z.string().optional().default(''),
  seat_label: z.string().optional().default(''),
  seat_zone: z.string().optional().default(''),
});

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  rating_comment: z.string().max(500).optional().default(''),
});

// Helper to map DB order structure to camelCase frontend payload
function mapOrderToFrontend(o: any) {
  if (!o) return null;
  return {
    id: o.id,
    userId: o.user_id,
    mixId: o.mix_id,
    liquidId: o.liquid_id,
    notes: o.notes,
    status: o.status,
    priority: o.priority,
    promisedDeliveryTime: o.promised_delivery_time,
    rating: o.rating,
    ratingComment: o.rating_comment,
    masterCalled: o.master_called,
    seatId: o.seat_id,
    seatLabel: o.seat_label,
    seatZone: o.seat_zone,
    price: o.price,
    createdAt: o.created_at,
  };
}

// POST /api/orders - Create a new hookah order (auth required)
router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const userId = req.user!.id;
    const promisedTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const priority = Date.now();

    const { data: userProfile } = await supabase
      .from('users')
      .select('personal_price, name, phone')
      .eq('id', userId)
      .maybeSingle();

    const orderPrice = userProfile?.personal_price || null;

    const { data: order, error: insertErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        mix_id: data.mix_id || null,
        liquid_id: data.liquid_id,
        notes: data.notes,
        status: 'accepted',
        priority,
        promised_delivery_time: promisedTime,
        seat_id: data.seat_id,
        seat_label: data.seat_label,
        seat_zone: data.seat_zone,
        price: orderPrice,
      })
      .select()
      .single();

    if (insertErr || !order) {
      res.status(500).json({ error: 'Не удалось создать заказ: ' + insertErr?.message });
      return;
    }

    // Fire-and-forget: status history
    supabase.from('order_status_history').insert({ order_id: order.id, status: 'accepted' }).then();

    // Auto-decrement tobacco stock and check for restock
    if (data.mix_id) {
      const { data: mix } = await supabase
        .from('mixes')
        .select('name, stock_quantity, min_stock_threshold, auto_reorder_enabled')
        .eq('id', data.mix_id)
        .single();

      if (mix) {
        const newStock = Math.max(0, (mix.stock_quantity || 0) - 1);
        supabase.from('mixes').update({ stock_quantity: newStock, updated_at: new Date().toISOString() }).eq('id', data.mix_id).then();

        if (newStock <= (mix.min_stock_threshold ?? 5) && mix.auto_reorder_enabled) {
          supabase.from('restock_requests').insert({
            tobacco_id: data.mix_id,
            tobacco_name: mix.name,
            quantity: Math.max(10, (mix.min_stock_threshold ?? 5) * 2),
            status: 'pending',
          }).then();
        }
      }
    }

    const mixDetails = { name: 'Индивидуальный микс' };

    if (userProfile) {
      sendOrderNotification(order, userProfile.name, userProfile.phone || 'Не указан', mixDetails).catch(() => {});
    }

    try { getIO().emit('order:created', mapOrderToFrontend(order)); } catch {}

    res.status(201).json(mapOrderToFrontend(order));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders - Get order queue (admin only or filtering)
router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const pag = getPagination(req, 50);

    let query = supabase
      .from('orders')
      .select('*, user:user_id(name, phone)')
      .range(pag.offset, pag.offset + pag.limit - 1);

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.not('status', 'eq', 'cancelled');
    }

    const { data: orders, error } = await query
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const mapped = (orders || []).map((o: any) => {
      const frontend = mapOrderToFrontend(o) as any;
      if (o.user) {
        frontend.user = { name: o.user.name, phone: o.user.phone };
      }
      return frontend;
    });

    res.json(paginatedResponse(mapped, count, pag));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my - Retrieve personal order history
router.get('/my', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pag = getPagination(req, 20, 100);
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, mix:mix_id(name, manufacturer)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .range(pag.offset, pag.offset + pag.limit - 1);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const mapped = (orders || []).map((o: any) => {
      const frontend = mapOrderToFrontend(o) as any;
      if (o.mix) {
        frontend.mixName = o.mix.name;
        frontend.mixManufacturer = o.mix.manufacturer;
      }
      return frontend;
    });

    res.json(paginatedResponse(mapped, count, pag));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/status - Status check (polling support)
router.get('/:id/status', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order) {
      res.status(404).json({ error: 'Заказ не найден', status: 404 });
      return;
    }

    res.json(mapOrderToFrontend(order));
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/request-master - Request master helper (button click)
router.post('/:id/request-master', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) {
      res.status(404).json({ error: 'Заказ не найден', status: 404 });
      return;
    }

    // Fetch user details for phone
    const { data: userObj } = await supabase
      .from('users')
      .select('phone')
      .eq('id', order.user_id)
      .maybeSingle();

    // Trigger Telegram Master Alarm
    sendMasterCallNotification(order, userObj?.phone || 'Не указан')
      .catch(err => console.warn('⚠️ TG Master Call alert error:', err.message));

    // Update flag in DB
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ master_called: true })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      res.status(500).json({ error: 'Не удалось обновить статус вызова: ' + updateErr.message });
      return;
    }

    // Broadcast to sockets
    try {
      const io = getIO();
      io.emit('order:updated', mapOrderToFrontend(updated));
    } catch (socketErr) {
      console.warn('⚠️ Socket IO update emit failed:', socketErr);
    }

    res.json({ success: true, message: 'Мастер вызван. Сообщение отправлено в Telegram.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/reset-master - Reset master call flag (admin only)
router.post('/:id/reset-master', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) {
      res.status(404).json({ error: 'Заказ не найден', status: 404 });
      return;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ master_called: false })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      res.status(500).json({ error: 'Не удалось сбросить вызов мастера: ' + updateErr.message });
      return;
    }

    try {
      const io = getIO();
      io.emit('order:updated', mapOrderToFrontend(updated));
    } catch (socketErr) {
      console.warn('⚠️ Socket IO update emit failed:', socketErr);
    }

    res.json({ success: true, message: 'Вызов мастера сброшен.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/rating - Submit order experience evaluation
router.post('/:id/rating', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ratingSchema.parse(req.body);

    // Retry loop to handle race condition on concurrent rating submissions
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('rating, user_id')
        .eq('id', req.params.id)
        .maybeSingle();

      if (fetchErr || !order) {
        res.status(404).json({ error: 'Заказ не найден', status: 404 });
        return;
      }

      if (order.user_id !== req.user!.id) {
        res.status(403).json({ error: 'Вы не можете оценивать чужие заказы', status: 403 });
        return;
      }

      if (order.rating !== null) {
        res.status(400).json({ error: 'Вы уже оценивали данный заказ', status: 400 });
        return;
      }

      const { data: updated, error: updateErr } = await supabase
        .from('orders')
        .update({
          rating: data.rating,
          rating_comment: data.rating_comment,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (!updateErr && updated) {
        res.json(mapOrderToFrontend(updated));
        return;
      }

      if (updateErr && attempt < MAX_RETRIES) {
        console.warn(`⚠️ [Rating] Update attempt ${attempt}/${MAX_RETRIES} failed, retrying: ${updateErr.message}`);
        await new Promise(r => setTimeout(r, 200 * attempt));
        continue;
      }

      res.status(500).json({ error: 'Не удалось сохранить рейтинг: ' + updateErr?.message });
      return;
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/orders/reorder - Reorder queue items (Admin only)
router.put('/reorder', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queueIds = req.body.ids;
    if (!Array.isArray(queueIds)) {
      res.status(400).json({ error: 'Некорректный формат. Ожидается массив ID заказов.', status: 400 });
      return;
    }

    // Set priority as index number (ascending) to maintain sorting
    for (let index = 0; index < queueIds.length; index++) {
      const orderId = queueIds[index];
      await supabase
        .from('orders')
        .update({ priority: index })
        .eq('id', orderId);
    }

    // Fetch and broadcast new order list to sockets
    const { data: orders } = await supabase
      .from('orders')
      .select('*, user:user_id(name, phone)')
      .order('priority', { ascending: true });

    const mapped = (orders || []).map((o: any) => {
      const frontend = mapOrderToFrontend(o) as any;
      if (o.user) frontend.user = { name: o.user.name, phone: o.user.phone };
      return frontend;
    });

    try {
      const io = getIO();
      io.emit('orders:reordered', mapped);
    } catch (socketErr) {
      console.warn('⚠️ Sockets queue update failed:', socketErr);
    }

    res.json({ success: true, orders: mapped });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/extend-time - Extend delivery promised time (Admin only)
router.post('/:id/extend-time', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minutes } = req.body;
    if (typeof minutes !== 'number' || minutes <= 0) {
      res.status(400).json({ error: 'Неверное количество минут', status: 400 });
      return;
    }

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) {
      res.status(404).json({ error: 'Заказ не найден', status: 404 });
      return;
    }

    const currentPromised = new Date(order.promised_delivery_time).getTime();
    const newPromised = new Date(currentPromised + minutes * 60 * 1000).toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ promised_delivery_time: newPromised })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      res.status(500).json({ error: 'Не удалось продлить время: ' + updateErr.message });
      return;
    }

    // Broadcast update
    try {
      const io = getIO();
      io.emit('order:updated', mapOrderToFrontend(updated));
    } catch (socketErr) {
      console.warn('⚠️ Sockets update extension emit failed:', socketErr);
    }

    res.json(mapOrderToFrontend(updated));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/preferences - Simple flavor recommendation logic
router.get('/me/preferences', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get client's past 15 orders that had a mix
    const { data: orders, error } = await supabase
      .from('orders')
      .select('mix_id, mixes(id, name, flavors)')
      .eq('user_id', userId)
      .not('mix_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const flavorCounts: Record<string, number> = {};
    const mixCounts: Record<string, number> = {};

    orders?.forEach((o: any) => {
      const mix = o.mixes;
      if (mix) {
        mixCounts[mix.name] = (mixCounts[mix.name] || 0) + 1;
        if (Array.isArray(mix.flavors)) {
          mix.flavors.forEach((fl: string) => {
            flavorCounts[fl] = (flavorCounts[fl] || 0) + 1;
          });
        }
      }
    });

    const topFlavors = Object.entries(flavorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 4);

    const topMixes = Object.entries(mixCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    res.json({
      topFlavors,
      topMixes,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/orders/:id/status - Update state (for admin dashboard preparation transitions)
router.put('/:id/status', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'preparing', 'roasting', 'delivering', 'done', 'cancelled'];
    
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Некорректный статус заказа', status: 400 });
      return;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr || !updated) {
      res.status(404).json({ error: 'Заказ не найден', status: 404 });
      return;
    }

    // Insert to status history log
    await supabase
      .from('order_status_history')
      .insert({
        order_id: updated.id,
        status,
      });

    // Send cancellation notification if applicable
    if (status === 'cancelled') {
      const { data: userObj } = await supabase
        .from('users')
        .select('name')
        .eq('id', updated.user_id)
        .maybeSingle();
      sendStatusNotification(
        config.telegramChatId || '',
        updated.seat_label || '',
        new Date(updated.created_at).toLocaleDateString('ru-RU'),
        new Date(updated.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        'cancelled'
      ).catch(() => {});
    }

    // Broadcast status change
    try {
      const io = getIO();
      io.emit('order:updated', mapOrderToFrontend(updated));
    } catch (socketErr) {
      console.warn('⚠️ Sockets status update emit failed:', socketErr);
    }

    res.json(mapOrderToFrontend(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/orders/:id — Hard-delete order (admin only)
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) {
      res.status(404).json({ error: 'Заказ не найден', status: 404 });
      return;
    }

    const { error: deleteHistoryErr } = await supabase
      .from('order_status_history')
      .delete()
      .eq('order_id', req.params.id);

    if (deleteHistoryErr) {
      res.status(500).json({ error: 'Не удалось удалить историю заказа: ' + deleteHistoryErr.message });
      return;
    }

    const { error: deleteErr } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);

    if (deleteErr) {
      res.status(500).json({ error: 'Не удалось удалить заказ: ' + deleteErr.message });
      return;
    }

    try {
      const io = getIO();
      io.emit('order:deleted', { id: req.params.id });
    } catch {}

    res.json({ success: true, message: 'Заказ удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
