import { config } from '../config/env';
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve(__dirname, '../../agents/agents/bughunter/log.md');
const STATUS_PATH = path.resolve(__dirname, '../../agents/status.json');

interface Digest {
  date: string;
  totalFound: number;
  totalFixed: number;
  totalEscalated: number;
  active: boolean;
  recentBugs: string[];
}

function readDigest(): Digest | null {
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    const bh = status.bughunter || {};
    if (!bh.enabled || bh.status === 'disabled') return null;

    const recentBugs: string[] = [];
    try {
      if (fs.existsSync(LOG_PATH)) {
        const content = fs.readFileSync(LOG_PATH, 'utf-8');
        const lines = content.split('\n').filter(Boolean).slice(-20);
        for (const line of lines) {
          if (line.startsWith('- ✅') || line.startsWith('- ❌') || line.startsWith('- ⚠️')) {
            recentBugs.push(line);
          }
        }
      }
    } catch {}

    return {
      date: new Date().toLocaleDateString('ru-RU'),
      totalFound: bh.found ?? 0,
      totalFixed: bh.fixed ?? 0,
      totalEscalated: bh.escalated ?? 0,
      active: bh.status === 'working' || bh.status === 'idle',
      recentBugs: recentBugs.slice(0, 10),
    };
  } catch {
    return null;
  }
}

function formatDigestMessage(digest: Digest): string {
  const header = `🤖 *BugHunter Daily Digest* — ${digest.date}`;
  const divider = '─────────────────────';
  const stats = `📊 *Статистика*
• Найдено багов: ${digest.totalFound}
• Исправлено: ${digest.totalFixed}
• Эскалировано: ${digest.totalEscalated}
• Статус: ${digest.active ? '✅ Активен' : '⛔ Выключен'}`;

  let recent = '';
  if (digest.recentBugs.length > 0) {
    recent = `\n\n📋 *Последние действия:*\n${digest.recentBugs.join('\n')}`;
  } else {
    recent = '\n\n📋 За отчётный период баги не обнаружены.';
  }

  return `${header}\n${divider}\n${stats}${recent}`;
}

export async function sendBugHunterDailyDigest(): Promise<void> {
  const digest = readDigest();
  if (!digest) return;

  const message = formatDigestMessage(digest);

  try {
    const token = config.telegramToken || process.env.TELEGRAM_TOKEN;
    const chatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.log('🤖 [BugHunter] Telegram not configured, skipping daily digest');
      return;
    }

    const url = `${config.telegramApiBaseUrl || 'https://api.telegram.org'}/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (res.ok) {
      console.log('🤖 [BugHunter] Daily digest sent to Telegram');
    } else {
      console.warn('⚠️ [BugHunter] Failed to send daily digest:', await res.text());
    }
  } catch (err: any) {
    console.error('⚠️ [BugHunter] Daily digest error:', err.message);
  }
}

// Schedule: run at 10:00 daily
export function startBugHunterDailyDigest(): void {
  const now = new Date();
  const target = new Date(now);
  target.setHours(10, 0, 0, 0);

  let msUntilTarget = target.getTime() - now.getTime();
  if (msUntilTarget < 0) {
    msUntilTarget += 24 * 60 * 60 * 1000;
  }

  console.log(`🤖 [BugHunter] Daily digest scheduled in ${Math.round(msUntilTarget / 60000)} min`);

  setTimeout(() => {
    sendBugHunterDailyDigest();
    // Then every 24h
    setInterval(sendBugHunterDailyDigest, 24 * 60 * 60 * 1000);
  }, msUntilTarget);
}
