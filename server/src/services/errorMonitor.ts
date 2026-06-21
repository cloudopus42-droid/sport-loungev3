import { config } from '../config/env';

interface ErrorEntry {
  timestamp: string;
  message: string;
  stack?: string;
  route?: string;
  userId?: string;
}

const MAX_ERRORS = 100;
const errorBuffer: ErrorEntry[] = [];
let pendingErrors: ErrorEntry[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const TELEGRAM_API = config.telegramToken
  ? `${config.telegramApiBaseUrl}/bot${config.telegramToken}`
  : null;

function sendToTelegram(errors: ErrorEntry[]): void {
  if (!TELEGRAM_API || !config.telegramChatId) return;

  const text = [
    '🚨 Server Error Alert',
    '',
    ...errors.map((e) => [
      `Message: ${e.message}`,
      e.route ? `Route: ${e.route}` : null,
      e.userId ? `User: ${e.userId}` : null,
      `Time: ${e.timestamp}`,
    ].filter(Boolean).join('\n')),
  ].join('\n\n');

  fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text: text.slice(0, 4096),
    }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

function flushPending(): void {
  if (pendingErrors.length === 0) return;
  const batch = [...pendingErrors];
  pendingErrors = [];
  sendToTelegram(batch);
}

function scheduleFlush(): void {
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushPending();
  }, 5 * 60 * 1000);
}

export function captureError(
  error: Error,
  context?: { route?: string; userId?: string; isCritical?: boolean }
): void {
  const entry: ErrorEntry = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    route: context?.route,
    userId: context?.userId,
  };

  errorBuffer.push(entry);
  if (errorBuffer.length > MAX_ERRORS) {
    errorBuffer.shift();
  }

  if (!TELEGRAM_API || !config.telegramChatId) return;

  if (context?.isCritical) {
    sendToTelegram([entry]);
  } else {
    pendingErrors.push(entry);
    if (pendingErrors.length >= 5) {
      flushPending();
    } else {
      scheduleFlush();
    }
  }
}

export function getRecentErrors(): ErrorEntry[] {
  return [...errorBuffer];
}
