import { config } from '../config/env';
import { ZONE_LABELS } from '../config/zones';
import { adminNotifyNewOrder, adminNotifyMasterCall } from './adminBot';

const ORDER_BOT_TOKEN = process.env.ORDER_BOT_TOKEN || ''; // SPORT LOUNGE BOT (@hookahversebot) - Заказы
const MANAGER_BOT_TOKEN = process.env.MANAGER_BOT_TOKEN || ''; // Menedher_bot (@llsportsmanager_bot) - Вызовы мастера

function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<boolean> {
  const telegramApi = `https://api.telegram.org/bot${token}`;
  try {
    const res = await fetch(`${telegramApi}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
      }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json() as any;
    if (data && data.ok) {
      console.log(' Telegram alert sent successfully.');
      return true;
    }
    console.error('Telegram API error:', data?.description);
    return false;
  } catch (err: any) {
    console.error(`❌ sendTelegramMessage failed: ${err.message}`);
    return false;
  }
}

export async function sendOrderNotification(order: any, userName: string, phone: string, mixDetails: any) {
  const chatId = config.telegramChatId;
  if (!chatId) { console.warn('⚠️ No TELEGRAM_CHAT_ID configured'); return false; }
  const zoneName = ZONE_LABELS[order.seat_zone] || order.seat_zone || 'Общий зал';
  const promisedTime = new Date(order.promised_delivery_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const queuePos = order.queue_position || 1;
  const waitMin = order.wait_minutes || 15;

  const message = [
    '💨 *НОВЫЙ ЗАКАЗ КАЛЬЯНА\\!*',
    '',
    `📍 *Место:* ${escapeMarkdown(order.seat_label || 'Не указан')} \\(${escapeMarkdown(zoneName)}\\)`,
    `🕐 *Обещанное время подачи:* ${escapeMarkdown(promisedTime)}`,
    `⏳ *Ожидание:* ~${waitMin} мин \\(очередь \\#${queuePos}\\)`,
    '',
    '🏺 *Спецификация:*',
    `   Микс: *${escapeMarkdown(mixDetails.name || 'Свой микс')}*`,
    `   Жидкость в колбе: *${escapeMarkdown(order.liquid_id === 'water' ? 'На воде' : order.liquid_id === 'milk' ? 'На молоке' : order.liquid_id === 'juice' ? 'На соке' : 'На вине/коктейле')}*`,
    order.notes ? `   Пожелания: _${escapeMarkdown(order.notes)}_` : '',
    '',
    `👤 *Заказчик:* ${escapeMarkdown(userName)}`,
    `📱 *Телефон:* ${escapeMarkdown(phone)}`,
  ].filter(Boolean).join('\n');

  // Also send interactive notification via admin bot
  adminNotifyNewOrder(
    order.id,
    order.seat_label,
    order.seat_zone,
    userName,
    mixDetails.name || 'Индивидуальный микс',
    order.promised_delivery_time,
    order.queue_position,
    order.wait_minutes,
  ).catch(err => console.warn('⚠️ Admin bot notify failed:', err.message));

  return sendTelegramMessage(ORDER_BOT_TOKEN, chatId, message);
}

export async function sendMasterCallNotification(order: any, phone: string) {
  const chatId = config.telegramChatId;
  if (!chatId) { console.warn('⚠️ No TELEGRAM_CHAT_ID configured'); return false; }
  const zoneName = ZONE_LABELS[order.seat_zone] || order.seat_zone || 'Общий зал';

  const message = [
    '🚨 *ВЫЗОВ КАЛЬЯННОГО МАЭСТРО\\!*',
    '',
    `📍 *Стол:* ${escapeMarkdown(order.seat_label)} \\(${escapeMarkdown(zoneName)}\\)`,
    '🔔 *Причина:* Требуется замена углей или помощь с кальяном\\!',
    '',
    `📱 *Контакты гостя:* ${escapeMarkdown(phone)}`,
    '🏃‍♂️ *Пожалуйста, подойдите к гостю незамедлительно\\!*'
  ].join('\n');

  // Also send interactive notification via admin bot
  adminNotifyMasterCall(
    order.id,
    order.seat_label,
    order.seat_zone,
    phone
  ).catch(err => console.warn('⚠️ Admin bot master call notify failed:', err.message));

  return sendTelegramMessage(MANAGER_BOT_TOKEN, chatId, message);
}

export async function sendDelayNotification(order: any, delayMinutes: number) {
  const chatId = config.telegramChatId;
  if (!chatId) { console.warn('⚠️ No TELEGRAM_CHAT_ID configured'); return false; }
  const zoneName = ZONE_LABELS[order.seat_zone] || order.seat_zone || 'Общий зал';

  const message = [
    '⚠️ *ТРЕВОГА: ЗАДЕРЖКА ЗАКАЗА\\!*',
    '',
    `📍 *Стол:* ${escapeMarkdown(order.seat_label || 'Не указан')} \\(${escapeMarkdown(zoneName)}\\)`,
    `🚨 *Заказ просрочен на:* *${delayMinutes} мин\\!*`,
    `⏳ *Новое время подачи:* ${escapeMarkdown(new Date(order.promised_delivery_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))}`,
    '',
    '💨 *Поторопитесь приготовить кальян\\!*'
  ].join('\n');

  return sendTelegramMessage(ORDER_BOT_TOKEN, chatId, message);
}
