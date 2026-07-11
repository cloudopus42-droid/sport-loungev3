import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { config } from '../config/env';
import { sendTelegramMessageSchema } from '../schemas/telegram.schema';
import { asyncHandler } from '../utils/http';

const router = Router();

const TELEGRAM_API = `${config.telegramApiBaseUrl}/bot${config.telegramToken}`;

interface QueuedMessage {
  id: string;
  payload: any;
  retries: number;
  maxRetries: number;
  resolve: (result: { success: boolean; error?: string }) => void;
}

const messageQueue: QueuedMessage[] = [];
let processing = false;

async function processQueue() {
  if (processing || messageQueue.length === 0) return;
  processing = true;

  const item = messageQueue.shift();
  if (!item) {
    processing = false;
    return;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.payload),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json() as any;

    if (data && data.ok) {
      console.log(`✅ [Telegram] Message sent successfully (${item.id})`);
      item.resolve({ success: true });
    } else {
      throw new Error(data?.description || 'Telegram API returned ok: false');
    }
  } catch (err: any) {
    if (item.retries < item.maxRetries) {
      const backoff = Math.pow(3, item.retries) * 1000;
      item.retries++;
      console.warn(`⚠️ [Telegram] Send failed (attempt ${item.retries}/${item.maxRetries}), retrying in ${backoff}ms: ${err.message}`);
      setTimeout(() => {
        messageQueue.push(item);
        setTimeout(processQueue, 100);
      }, backoff);
    } else {
      console.error(`❌ [Telegram] All ${item.maxRetries} retries exhausted: ${err.message}`);
      item.resolve({ success: false, error: err.message });
    }
  }

  processing = false;
  setTimeout(processQueue, 100);
}

function sendWithRetry(payload: any, maxRetries: number): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    messageQueue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      payload,
      retries: 0,
      maxRetries,
      resolve,
    });
    setTimeout(processQueue, 50);
  });
}

// POST /api/telegram/send — send a message via Telegram (admin)
router.post('/send', auth, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = sendTelegramMessageSchema.parse(req.body);

  if (!config.telegramToken || !config.telegramChatId) {
    res.status(503).json({ success: false, error: 'Telegram не настроен' });
    return;
  }

  const payload = {
    chat_id: data.chat_id,
    text: data.text,
    parse_mode: data.parse_mode,
    disable_web_page_preview: data.disable_web_page_preview,
    disable_notification: false,
  };

  const result = await sendWithRetry(payload, 3);

  if (result.success) {
    res.json({ success: true, message: 'Сообщение отправлено' });
  } else {
    res.status(502).json({ success: false, error: result.error || 'Не удалось отправить сообщение' });
  }
}));

// POST /api/telegram/test — quick connectivity test
router.post('/test', auth, isAdmin, asyncHandler(async (_req: Request, res: Response) => {
  if (!config.telegramToken || !config.telegramChatId) {
    res.status(503).json({ success: false, error: 'Telegram не настроен' });
    return;
  }

  const payload = {
    chat_id: config.telegramChatId,
    text: '🧪 *Test message from SPORT LOUNGE server*',
    parse_mode: 'MarkdownV2',
  };

  const result = await sendWithRetry(payload, 2);

  if (result.success) {
    res.json({ success: true, message: 'Telegram connectivity OK' });
  } else {
    res.status(502).json({ success: false, error: result.error || 'Telegram недоступен' });
  }
}));

export default router;
