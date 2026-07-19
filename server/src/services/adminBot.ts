import { supabase } from '../config/supabase';

const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN || '';
const TELEGRAM_API = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}`;
const ALLOWED_ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const ADMIN_USERNAMES = (process.env.ADMIN_TELEGRAM_USERNAMES || '').split(',').map(s => s.trim().toLowerCase().replace('@', '')).filter(Boolean);

const knownAdminChatIds: Set<number> = new Set(ALLOWED_ADMIN_IDS.map(Number).filter(n => !isNaN(n)));

const statusIcons: Record<string, string> = {
  accepted: '📥',
  confirmed: '✅',
  preparing: '🔄',
  roasting: '🔥',
  delivering: '🚚',
  delivered: '✅',
  done: '✅',
  cancelled: '❌',
};

const statusLabels: Record<string, string> = {
  accepted: 'Принят',
  confirmed: 'Подтверждён',
  preparing: 'Готовится',
  roasting: 'Забивка',
  delivering: 'Несут',
  delivered: 'Доставлен',
  done: 'Выполнен',
  cancelled: 'Отменён',
};

const allowedStatuses = ['accepted', 'confirmed', 'preparing', 'roasting', 'delivering', 'delivered', 'done'];

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function callTelegramApi(method: string, body: any, timeoutMs = 5000): Promise<any> {
  const url = `${TELEGRAM_API}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json() as any;
  if (data && data.ok) return data;
  throw new Error(data?.description || 'Telegram API returned ok: false');
}

async function getUpdates(offset: number, timeout = 30): Promise<any[]> {
  const url = `${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=${timeout}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout((timeout + 5) * 1000),
  });
  const data = await res.json() as any;
  if (data && data.ok) return data.result || [];
  return [];
}

async function isAdminUser(telegramId: number, username?: string): Promise<boolean> {
  if (ALLOWED_ADMIN_IDS.includes(String(telegramId))) return true;
  if (username) {
    const clean = username.toLowerCase().replace('@', '');
    if (ADMIN_USERNAMES.includes(clean)) return true;
  }
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return !!data && data.role === 'admin';
}

async function ensureAdminChatId(chatId: number) {
  knownAdminChatIds.add(chatId);
  try {
    await supabase
      .from('admin_telegram_chats')
      .upsert(
        { chat_id: chatId, updated_at: new Date().toISOString() },
        { onConflict: 'chat_id' }
      );
  } catch (err: any) {
    console.warn('⚠️ Failed to persist admin chat_id:', err.message);
  }
}

async function loadAdminChatIds(): Promise<void> {
  try {
    const { data } = await supabase
      .from('admin_telegram_chats')
      .select('chat_id');
    if (data) {
      for (const row of data) {
        knownAdminChatIds.add(Number(row.chat_id));
      }
      console.log(`💾 [Admin Bot] Loaded ${data.length} persisted admin chat IDs`);
    }
  } catch (err: any) {
    console.warn('⚠️ [Admin Bot] Failed to load persisted chat IDs:', err.message);
  }
}

function orderDetailText(order: any, userName?: string, phone?: string): string {
  const icon = statusIcons[order.status] || '📋';
  const label = statusLabels[order.status] || order.status;
  const created = new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const promised = new Date(order.promised_delivery_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const lines = [
    `${icon} <b>Заказ #${escapeHtml(String(order.id).slice(0, 8))}</b>`,
    `📍 <b>Стол:</b> ${escapeHtml(order.seat_label || '—')} (${escapeHtml(order.seat_zone || '—')})`,
    userName ? `👤 <b>Клиент:</b> ${escapeHtml(userName)}` : '',
    phone ? `📱 <b>Телефон:</b> ${escapeHtml(phone)}` : '',
    `🏺 <b>Микс:</b> ${escapeHtml(order.mix_name || 'Индивидуальный')}`,
    `💧 <b>Жидкость:</b> ${escapeHtml(order.liquid_id === 'water' ? 'На воде' : order.liquid_id === 'milk' ? 'На молоке' : order.liquid_id === 'juice' ? 'На соке' : 'Коктейль')}`,
    order.notes ? `📝 <b>Заметки:</b> ${escapeHtml(order.notes)}` : '',
    '',
    `🕐 <b>Создан:</b> ${created}`,
    `🕐 <b>Обещан:</b> ${promised}`,
    `📊 <b>Статус:</b> ${icon} ${label}`,
    order.master_called ? '🚨 <b>Вызван мастер!</b>' : '',
  ];

  return lines.filter(Boolean).join('\n');
}

function statusKeyboard(orderId: string): any {
  return {
    inline_keyboard: [
      [
        { text: '📥 Принять', callback_data: `admin_status:${orderId}:confirmed` },
        { text: '🔄 Готовить', callback_data: `admin_status:${orderId}:preparing` },
      ],
      [
        { text: '🔥 Забивка', callback_data: `admin_status:${orderId}:roasting` },
        { text: '🚚 Нести', callback_data: `admin_status:${orderId}:delivering` },
      ],
      [
        { text: '✅ Готово', callback_data: `admin_status:${orderId}:done` },
        { text: '❌ Отменить', callback_data: `admin_cancel:${orderId}` },
      ],
      [
        { text: '📋 Детали', callback_data: `admin_detail:${orderId}` },
        { text: '🔄 Замена', callback_data: `admin_replace:${orderId}` },
      ],
      [
        { text: '🔄 Обновить', callback_data: `admin_refresh:${orderId}` },
      ],
    ],
  };
}

function mainKeyboard(): any {
  return {
    inline_keyboard: [
      [
        { text: '📋 Активные заказы', callback_data: 'admin_list_active' },
        { text: '❌ Просроченные', callback_data: 'admin_list_delayed' },
      ],
      [
        { text: '🔄 Обновить', callback_data: 'admin_list_active' },
      ],
    ],
  };
}

async function fetchOrderWithDetails(orderId: string): Promise<{ order: any; userName?: string; phone?: string } | null> {
  const { data: order } = await supabase
    .from('orders')
    .select('*, user:user_id(name, phone), mix:mix_id(name)')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return null;

  const result: any = { order };
  if (order.user) {
    result.userName = order.user.name;
    result.phone = order.user.phone;
  }
  if (order.mix) {
    result.order.mix_name = order.mix.name;
  }
  return result;
}

async function formatOrderList(orders: any[]): Promise<string> {
  if (orders.length === 0) return '📭 <b>Нет активных заказов.</b>';

  const lines = ['📋 <b>Активные заказы:</b>\n'];
  for (const o of orders) {
    const icon = statusIcons[o.status] || '📋';
    const label = statusLabels[o.status] || o.status;
    const promised = new Date(o.promised_delivery_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const name = o.user?.name || '';
    lines.push(`${icon} #${String(o.id).slice(0, 8)} — ${escapeHtml(o.seat_label || '—')} — ${label} — ${promised}${name ? ` — ${escapeHtml(name)}` : ''}`);
  }

  return lines.join('\n');
}

async function handleCommand(chatId: number, text: string) {
  if (text.startsWith('/start')) {
    const welcome = [
      '👋 <b>SPORT LOUNGE — Административный бот</b>',
      '',
      'Управляйте заказами, отслеживайте статусы и получайте уведомления в реальном времени.',
      '',
      '📋 <b>Команды:</b>',
      '  /orders — список активных заказов',
      '  /order &lt;id&gt; — детали заказа',
      '  /settings — настройки уведомлений',
    ].join('\n');
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: welcome,
      parse_mode: 'HTML',
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (text.startsWith('/orders')) {
    await sendOrderList(chatId);
    return;
  }

  if (text.startsWith('/order ')) {
    const orderId = text.slice(7).trim();
    if (!orderId) {
      await callTelegramApi('sendMessage', { chat_id: chatId, text: '❌ Укажите ID заказа: /order &lt;id&gt;', parse_mode: 'HTML' });
      return;
    }
    await sendOrderDetail(chatId, orderId);
    return;
  }

  if (text.startsWith('/settings')) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '⚙️ <b>Настройки бота</b>\n\nУведомления о новых заказах и вызовах мастера приходят автоматически.\nДополнительные настройки появятся в следующих обновлениях.',
      parse_mode: 'HTML',
    });
    return;
  }

  // Respond to any unrecognized message with a helpful hint
  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: '⚠️ Неизвестная команда. Используйте /start для меню или /orders для списка заказов.',
    parse_mode: 'HTML',
  });
}

async function sendOrderList(chatId: number) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*, user:user_id(name)')
    .neq('status', 'done')
    .neq('status', 'cancelled')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (!orders || orders.length === 0) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '📭 <b>Нет активных заказов.</b>',
      parse_mode: 'HTML',
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const listText = await formatOrderList(orders);
  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: listText,
    parse_mode: 'HTML',
    reply_markup: mainKeyboard(),
  });
}

async function sendOrderDetail(chatId: number, orderId: string) {
  const result = await fetchOrderWithDetails(orderId);
  if (!result) {
    await callTelegramApi('sendMessage', { chat_id: chatId, text: '❌ Заказ не найден.', parse_mode: 'HTML' });
    return;
  }

  const text = orderDetailText(result.order, result.userName, result.phone);
  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: statusKeyboard(orderId),
  });
}

async function sendDelayedOrderList(chatId: number) {
  const now = new Date().toISOString();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, user:user_id(name)')
    .neq('status', 'done')
    .neq('status', 'cancelled')
    .lt('promised_delivery_time', now)
    .order('promised_delivery_time', { ascending: true });

  if (!orders || orders.length === 0) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '✅ <b>Нет просроченных заказов.</b>',
      parse_mode: 'HTML',
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const lines = ['⚠️ <b>Просроченные заказы:</b>\n'];
  for (const o of orders) {
    const icon = statusIcons[o.status] || '📋';
    const label = statusLabels[o.status] || o.status;
    const promised = new Date(o.promised_delivery_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const name = o.user?.name || '';
    lines.push(`${icon} #${String(o.id).slice(0, 8)} — ${escapeHtml(o.seat_label || '—')} — ${label} — было: ${promised}${name ? ` — ${escapeHtml(name)}` : ''}`);
  }

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: lines.join('\n'),
    parse_mode: 'HTML',
    reply_markup: mainKeyboard(),
  });
}

async function handleCallback(chatId: number, callbackId: string, data: string) {
  try {
    await callTelegramApi('answerCallbackQuery', { callback_query_id: callbackId });
  } catch { /* ignore */ }

  if (data === 'admin_list_active') {
    await sendOrderList(chatId);
    return;
  }

  if (data === 'admin_list_delayed') {
    await sendDelayedOrderList(chatId);
    return;
  }

  const statusMatch = data.match(/^admin_status:(.+?):(.+)$/);
  if (statusMatch) {
    const orderId = statusMatch[1];
    const newStatus = statusMatch[2];

    if (!allowedStatuses.includes(newStatus)) {
      await callTelegramApi('sendMessage', { chat_id: chatId, text: `❌ Некорректный статус: ${escapeHtml(newStatus)}`, parse_mode: 'HTML' });
      return;
    }

    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      await callTelegramApi('sendMessage', { chat_id: chatId, text: '❌ Заказ не найден.', parse_mode: 'HTML' });
      return;
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateErr) {
      await callTelegramApi('sendMessage', { chat_id: chatId, text: `❌ Ошибка: ${escapeHtml(updateErr.message)}`, parse_mode: 'HTML' });
      return;
    }

    await supabase
      .from('order_status_history')
      .insert({ order_id: orderId, status: newStatus });

    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('order:updated', { id: orderId, status: newStatus });
    } catch { /* ignore */ }

    const updatedOrder = await fetchOrderWithDetails(orderId);
    const text = updatedOrder
      ? orderDetailText(updatedOrder.order, updatedOrder.userName, updatedOrder.phone)
      : `✅ Статус заказа #${escapeHtml(orderId.slice(0, 8))} изменён на "${statusLabels[newStatus] || newStatus}"`;

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: statusKeyboard(orderId),
    });
    return;
  }

  const cancelMatch = data.match(/^admin_cancel:(.+)$/);
  if (cancelMatch) {
    const orderId = cancelMatch[1];

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (updateErr) {
      await callTelegramApi('sendMessage', { chat_id: chatId, text: `❌ Ошибка: ${escapeHtml(updateErr.message)}`, parse_mode: 'HTML' });
      return;
    }

    await supabase
      .from('order_status_history')
      .insert({ order_id: orderId, status: 'cancelled' });

    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('order:updated', { id: orderId, status: 'cancelled' });
    } catch { /* ignore */ }

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: `❌ Заказ #${escapeHtml(orderId.slice(0, 8))} отменён.`,
      parse_mode: 'HTML',
    });
    return;
  }

  const detailMatch = data.match(/^admin_detail:(.+)$/);
  if (detailMatch) {
    await sendOrderDetail(chatId, detailMatch[1]);
    return;
  }

  const refreshMatch = data.match(/^admin_refresh:(.+)$/);
  if (refreshMatch) {
    await sendOrderDetail(chatId, refreshMatch[1]);
    return;
  }

  const replaceMatch = data.match(/^admin_replace:(.+)$/);
  if (replaceMatch) {
    await startReplacementFlow(chatId, replaceMatch[1]);
    return;
  }

  const replaceConfirmMatch = data.match(/^admin_replace_confirm:(.+?):(.+)$/);
  if (replaceConfirmMatch) {
    await confirmReplacement(chatId, replaceConfirmMatch[1], replaceConfirmMatch[2]);
    return;
  }

  const replaceCancelMatch = data.match(/^admin_replace_cancel:(.+)$/);
  if (replaceCancelMatch) {
    await sendOrderDetail(chatId, replaceCancelMatch[1]);
    return;
  }

  console.warn(`⚠️ [Admin Bot] Unknown callback data: ${data}`);
}

async function startReplacementFlow(chatId: number, orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    await callTelegramApi('sendMessage', { chat_id: chatId, text: '❌ Заказ не найден.', parse_mode: 'HTML' });
    return;
  }

  const { data: mixes } = await supabase
    .from('mixes')
    .select('id, name')
    .order('name');

  if (!mixes || mixes.length === 0) {
    await callTelegramApi('sendMessage', { chat_id: chatId, text: '❌ Нет доступных миксов для замены.', parse_mode: 'HTML' });
    return;
  }

  const rows = [];
  for (let i = 0; i < mixes.length; i += 2) {
    const row = [
      { text: mixes[i].name, callback_data: `admin_replace_confirm:${orderId}:${mixes[i].id}` },
    ];
    if (mixes[i + 1]) {
      row.push({ text: mixes[i + 1].name, callback_data: `admin_replace_confirm:${orderId}:${mixes[i + 1].id}` });
    }
    rows.push(row);
  }

  rows.push([{ text: '❌ Отмена', callback_data: `admin_replace_cancel:${orderId}` }]);

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: `🔄 <b>Замена кальяна для заказа #${escapeHtml(orderId.slice(0, 8))}</b>\n\nВыберите новый микс:`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: rows },
  });
}

async function confirmReplacement(chatId: number, orderId: string, newMixId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('user_id, seat_label, seat_zone, seat_id, liquid_id, notes')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    await callTelegramApi('sendMessage', { chat_id: chatId, text: '❌ Заказ не найден.', parse_mode: 'HTML' });
    return;
  }

  const { data: mix } = await supabase
    .from('mixes')
    .select('name')
    .eq('id', newMixId)
    .maybeSingle();

  const promisedTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const priority = Date.now();

  const { data: replacement, error: insertErr } = await supabase
    .from('orders')
    .insert({
      user_id: order.user_id,
      mix_id: newMixId,
      liquid_id: order.liquid_id,
      notes: `Замена для заказа #${orderId.slice(0, 8)}. ${order.notes || ''}`,
      status: 'accepted',
      priority,
      promised_delivery_time: promisedTime,
      seat_id: order.seat_id,
      seat_label: order.seat_label,
      seat_zone: order.seat_zone,
      replacement_for: orderId,
    })
    .select()
    .single();

  if (insertErr || !replacement) {
    await callTelegramApi('sendMessage', { chat_id: chatId, text: `❌ Ошибка создания замены: ${escapeHtml(insertErr?.message || '')}`, parse_mode: 'HTML' });
    return;
  }

  await supabase
    .from('order_status_history')
    .insert({ order_id: replacement.id, status: 'accepted' });

  try {
    const { getIO } = require('../socket');
    const io = getIO();
    io.emit('order:created', { id: replacement.id, status: 'accepted' });
  } catch { /* ignore */ }

  const text = [
    `✅ <b>Замена создана!</b>`,
    '',
    `🆕 Новый заказ #${escapeHtml(String(replacement.id).slice(0, 8))}`,
    `🏺 Микс: ${escapeHtml(mix?.name || 'Индивидуальный')}`,
    `🔄 Замена для: #${escapeHtml(orderId.slice(0, 8))}`,
  ].join('\n');

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: statusKeyboard(replacement.id),
  });
}

async function handleUpdate(update: any) {
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from;

    if (!user) return;

    if (!(await isAdminUser(user.id, user.username))) {
      console.log(`⛔ [Admin Bot] Unauthorized access attempt from user ${user.id} (${user.first_name})`);
      return;
    }

    await ensureAdminChatId(chatId);
    console.log(`👤 [Admin Bot] Command from ${user.first_name} (${chatId}): "${text}"`);
    await handleCommand(chatId, text);
  }

  else if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message.chat.id;
    const data = cq.data;
    const user = cq.from;

    if (!user) return;

    if (!(await isAdminUser(user.id, user.username))) {
      console.log(`⛔ [Admin Bot] Unauthorized callback from user ${user.id}`);
      return;
    }

    await ensureAdminChatId(chatId);
    console.log(`🖱️ [Admin Bot] Callback from ${user.first_name}: "${data}"`);
    await handleCallback(chatId, cq.id, data);
  }
}

export async function startAdminBot() {
  if (!ADMIN_BOT_TOKEN) {
    console.log('⚠️ [Admin Bot] ADMIN_BOT_TOKEN not set, skipping.');
    return;
  }

  console.log('🤖 [Admin Bot] Starting service...');

  // Load persisted admin chat IDs from Supabase
  await loadAdminChatIds();

  let offset = 0;
  let isPolling = true;

  const poll = async () => {
    while (isPolling) {
      try {
        const updates = await getUpdates(offset, 25);
        for (const update of updates) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      } catch (err: any) {
        if (err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('Abort')) {
          continue;
        }
        console.error('⚠️ [Admin Bot] Polling error, retrying in 10s:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  };

  poll().catch((err) => {
    console.error('🚨 [Admin Bot] Fatal polling error:', err);
  });

  return () => {
    isPolling = false;
    console.log('🔌 [Admin Bot] Service stopped.');
  };
}

export async function adminNotifyNewOrder(
  orderId: string,
  seatLabel: string,
  seatZone: string,
  userName: string,
  mixName: string,
  promisedTime: string,
  queuePosition?: number,
  waitMinutes?: number
): Promise<void> {
  if (!ADMIN_BOT_TOKEN) return;

  const time = new Date(promisedTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const queueInfo = queuePosition ? ` (очередь #${queuePosition}, ~${waitMinutes} мин)` : '';

  const text = [
    '💨 <b>НОВЫЙ ЗАКАЗ КАЛЬЯНА!</b>',
    '',
    `📍 <b>Стол:</b> ${escapeHtml(seatLabel)} (${escapeHtml(seatZone)})`,
    `👤 <b>Клиент:</b> ${escapeHtml(userName)}`,
    `🏺 <b>Микс:</b> ${escapeHtml(mixName)}`,
    `🕐 <b>Обещан:</b> ${time}${queueInfo}`,
  ].join('\n');

  for (const adminChatId of knownAdminChatIds) {
    try {
      await callTelegramApi('sendMessage', {
        chat_id: adminChatId,
        text,
        parse_mode: 'HTML',
        reply_markup: statusKeyboard(orderId),
      });
    } catch (err: any) {
      console.warn(`⚠️ [Admin Bot] Failed to notify admin ${adminChatId}: ${err.message}`);
    }
  }
}

export async function adminNotifyMasterCall(
  orderId: string,
  seatLabel: string,
  seatZone: string,
  phone: string
): Promise<void> {
  if (!ADMIN_BOT_TOKEN) return;

  const text = [
    '🚨 <b>ВЫЗОВ КАЛЬЯННОГО МАЭСТРО!</b>',
    '',
    `📍 <b>Стол:</b> ${escapeHtml(seatLabel)} (${escapeHtml(seatZone)})`,
    `📱 <b>Телефон:</b> ${escapeHtml(phone)}`,
  ].join('\n');

  for (const adminChatId of knownAdminChatIds) {
    try {
      await callTelegramApi('sendMessage', {
        chat_id: adminChatId,
        text,
        parse_mode: 'HTML',
        reply_markup: statusKeyboard(orderId),
      });
    } catch (err: any) {
      console.warn(`⚠️ [Admin Bot] Failed to notify admin ${adminChatId}: ${err.message}`);
    }
  }
}
