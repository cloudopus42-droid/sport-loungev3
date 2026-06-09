import { config } from '../config/env';

const ORDER_BOT_TOKEN = process.env.ORDER_BOT_TOKEN || ''; // SPORT LOUNGE BOT (@hookahversebot) - Заказы
const MANAGER_BOT_TOKEN = process.env.MANAGER_BOT_TOKEN || ''; // Menedher_bot (@llsportsmanager_bot) - Вызовы мастера

const zoneLabels: Record<string, string> = {
  hall: '🖥 Общий зал',
  vip: '👑 VIP PS',
  ps: '🎮 PlayStation (2эт)',
  room: '🎮 PS + ПК',
  pro: '⚡ PRO 600Hz',
  oled: '✨ OLED 4K',
};

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
      signal: AbortSignal.timeout(4000),
    });

    const data = await res.json() as any;
    if (data && data.ok) {
      console.log(' Telegram alert sent successfully.');
      return true;
    }
    throw new Error(data?.description || 'API returned ok: false');
  } catch (err: any) {
    console.warn(`⚠️ Direct sendTelegramMessage failed: ${err.message}. Trying CodeTabs proxy fallback...`);
    try {
      const targetUrl = `${telegramApi}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=MarkdownV2`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      const data = await res.json() as any;
      if (data && data.ok) {
        console.log('🎉 Telegram alert sent via proxy.');
        return true;
      }
    } catch (proxyErr: any) {
      console.error('❌ Telegram Proxy fallback failed:', proxyErr.message);
    }
    return false;
  }
}

export async function sendOrderNotification(order: any, userName: string, phone: string, mixDetails: any) {
  const chatId = config.telegramChatId || '5652912760';
  const zoneName = zoneLabels[order.seat_zone] || order.seat_zone || 'Общий зал';
  const promisedTime = new Date(order.promised_delivery_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const message = [
    '💨 *НОВЫЙ ЗАКАЗ КАЛЬЯНА\\!*',
    '',
    `📍 *Место:* ${escapeMarkdown(order.seat_label || 'Не указан')} \\(${escapeMarkdown(zoneName)}\\)`,
    `🕐 *Обещанное время подачи:* ${escapeMarkdown(promisedTime)} \\(15 мин\\)`,
    '',
    '🏺 *Спецификация:*',
    `   Микс: *${escapeMarkdown(mixDetails.name || 'Свой микс')}*`,
    `   Жидкость в колбе: *${escapeMarkdown(order.liquid_id === 'water' ? 'На воде' : order.liquid_id === 'milk' ? 'На молоке' : order.liquid_id === 'juice' ? 'На соке' : 'На вине/коктейле')}*`,
    order.notes ? `   Пожелания: _${escapeMarkdown(order.notes)}_` : '',
    '',
    `👤 *Заказчик:* ${escapeMarkdown(userName)}`,
    `📱 *Телефон:* ${escapeMarkdown(phone)}`,
  ].filter(Boolean).join('\n');

  return sendTelegramMessage(ORDER_BOT_TOKEN, chatId, message);
}

export async function sendMasterCallNotification(seatLabel: string, seatZone: string, phone: string) {
  const chatId = config.telegramChatId || '5652912760';
  const zoneName = zoneLabels[seatZone] || seatZone || 'Общий зал';

  const message = [
    '🚨 *ВЫЗОВ КАЛЬЯННОГО МАЭСТРО\\!*',
    '',
    `📍 *Стол:* ${escapeMarkdown(seatLabel)} \\(${escapeMarkdown(zoneName)}\\)`,
    '🔔 *Причина:* Требуется замена углей или помощь с кальяном\\!',
    '',
    `📱 *Контакты гостя:* ${escapeMarkdown(phone)}`,
    '🏃‍♂️ *Пожалуйста, подойдите к гостю незамедлительно\\!*'
  ].join('\n');

  return sendTelegramMessage(MANAGER_BOT_TOKEN, chatId, message);
}

export async function sendDelayNotification(order: any, delayMinutes: number) {
  const chatId = config.telegramChatId || '5652912760';
  const zoneName = zoneLabels[order.seat_zone] || order.seat_zone || 'Общий зал';

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
