import { config } from '../config/env';
import { ZONE_LABELS } from '../config/zones';

const TELEGRAM_API = `${config.telegramApiBaseUrl}/bot${config.telegramToken}`;

interface BookingInfo {
  seatLabel: string;
  seatZone: string;
  date: string;
  time: string;
  guestsCount: number;
  phone: string;
  userName: string;
  userEmail: string;
  hookahMix?: string;
  hookahStrength?: string;
  hookahCount?: number;
  comment?: string;
}

interface QueuedNotification {
  id: string;
  booking: BookingInfo;
  retries: number;
  nextAttempt: number;
}

const telegramQueue: QueuedNotification[] = [];
let queueActive = false;

async function processQueue() {
  if (queueActive || telegramQueue.length === 0) return;
  queueActive = true;
  
  const now = Date.now();
  const nextUpIdx = telegramQueue.findIndex(q => q.nextAttempt <= now);
  
  if (nextUpIdx === -1) {
    queueActive = false;
    // Reschedule queue checking
    setTimeout(processQueue, 10000);
    return;
  }
  
  const item = telegramQueue[nextUpIdx];
  // Remove from queue for processing
  telegramQueue.splice(nextUpIdx, 1);
  
  const success = await executeTelegramSend(item.booking);
  if (success) {
    console.log(`✅ [Queue] Notification successfully sent for: ${item.booking.seatLabel}`);
  } else {
    if (item.retries < 5) {
      item.retries++;
      // Backoff intervals: 30s, 2m, 5m, 15m, 30m
      const backoffs = [30000, 120000, 300000, 900000, 1800000];
      const delay = backoffs[item.retries - 1] || 1800000;
      item.nextAttempt = Date.now() + delay;
      telegramQueue.push(item);
      console.log(`⚠️ [Queue] Send failed, rescheduled attempt ${item.retries}/5 in ${delay/1000}s for: ${item.booking.seatLabel}`);
    } else {
      console.error(`❌ [Queue] Max retries reached, notification discarded for: ${item.booking.seatLabel}`);
    }
  }
  
  queueActive = false;
  // Chain processing next item immediately
  setTimeout(processQueue, 1000);
}

// Internal sender
async function executeTelegramSend(booking: BookingInfo): Promise<boolean> {
  const chatId = config.telegramChatId;
  const zoneName = ZONE_LABELS[booking.seatZone] || booking.seatZone;
  const strengthLabels: Record<string, string> = {
    light: 'Лёгкий',
    medium: 'Средний',
    strong: 'Крепкий',
  };

  const message = [
    '🔥 *Новый заказ\\!*',
    '',
    `📍 *Стол:* ${escapeMarkdown(booking.seatLabel)} \\(${escapeMarkdown(zoneName)}\\)`,
    `📅 *Дата:* ${escapeMarkdown(booking.date)}`,
    `🕐 *Время:* ${escapeMarkdown(booking.time)}`,
    `👥 *Гостей:* ${booking.guestsCount}`,
    '',
    '💨 *Кальян:*',
    `   Микс: ${escapeMarkdown(booking.hookahMix || 'Не указан')}`,
    `   Крепость: ${escapeMarkdown(strengthLabels[booking.hookahStrength || 'medium'] || 'Средний')}`,
    `   Количество: ${booking.hookahCount || 1}`,
    '',
    `📱 *Телефон:* ${escapeMarkdown(booking.phone)}`,
    `👤 *Гость:* ${escapeMarkdown(booking.userName)}`,
    `📧 *Email:* ${escapeMarkdown(booking.userEmail)}`,
    booking.comment ? `💬 *Комментарий:* ${escapeMarkdown(booking.comment)}` : '',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
      signal: AbortSignal.timeout(2500)
    });

    const data = (await res.json()) as any;
    return !!data.ok;
  } catch (error: any) {
    console.warn('⚠️ Direct Telegram send failed or timed out. Attempting proxy fallback via CodeTabs...');
    try {
      const targetUrl = `${TELEGRAM_API}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=MarkdownV2`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as any;
      if (data && data.ok) {
        console.log('🎉 Telegram notification delivered successfully via CodeTabs proxy!');
        return true;
      }
    } catch (fallbackErr: any) {
      console.error('❌ Telegram Proxy fallback failed:', fallbackErr.message);
    }
    return false;
  }
}

export async function sendBookingNotification(booking: BookingInfo): Promise<boolean> {
  const chatId = config.telegramChatId;
  if (!chatId || !config.telegramToken) {
    console.log('⚠️ Telegram not configured, skipping notification');
    return false;
  }

  // Push to queue immediately and trigger queue processor
  telegramQueue.push({
    id: `${Date.now()}-${Math.random()}`,
    booking,
    retries: 0,
    nextAttempt: Date.now(),
  });

  console.log(`✉️ [Queue] Notification queued for: ${booking.seatLabel}`);
  setTimeout(processQueue, 500);
  return true;
}

export async function sendStatusNotification(
  chatId: string,
  seatLabel: string,
  date: string,
  time: string,
  status: 'confirmed' | 'cancelled'
): Promise<boolean> {
  if (!config.telegramToken || !config.telegramChatId) return false;

  const statusText = status === 'confirmed' ? '✅ Подтверждена' : '❌ Отклонена';
  const message = [
    `${statusText}`,
    '',
    `📍 Стол: ${escapeMarkdown(seatLabel)}`,
    `📅 ${escapeMarkdown(date)} в ${escapeMarkdown(time)}`,
  ].join('\n');

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
      signal: AbortSignal.timeout(2500)
    });
    const data = (await res.json()) as any;
    return !!(data && data.ok);
  } catch {
    try {
      const targetUrl = `${TELEGRAM_API}/sendMessage?chat_id=${config.telegramChatId}&text=${encodeURIComponent(message)}&parse_mode=MarkdownV2`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as any;
      return !!(data && data.ok);
    } catch {
      return false;
    }
  }
}

export async function sendChatMessageNotification(
  userName: string,
  userEmail: string,
  messageText: string
): Promise<boolean> {
  const chatId = config.telegramChatId;
  if (!chatId || !config.telegramToken) return false;

  const message = [
    '💬 *Новое сообщение в чате на сайте\\!*',
    '',
    `👤 *От кого:* ${escapeMarkdown(userName)}`,
    `📧 *Email:* ${escapeMarkdown(userEmail)}`,
    '',
    `✉️ *Сообщение:*`,
    `${escapeMarkdown(messageText)}`,
  ].join('\n');

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
      signal: AbortSignal.timeout(2500)
    });
    const data = (await res.json()) as any;
    return !!(data && data.ok);
  } catch {
    try {
      const targetUrl = `${TELEGRAM_API}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=MarkdownV2`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as any;
      return !!(data && data.ok);
    } catch {
      return false;
    }
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
