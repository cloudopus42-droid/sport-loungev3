import { config } from '../config/env';

const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN || '';
const MANAGER_BOT_TOKEN = process.env.MANAGER_BOT_TOKEN || '';
const TELEGRAM_API_SUPPORT = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}`;
const TELEGRAM_API_MANAGER = `https://api.telegram.org/bot${MANAGER_BOT_TOKEN}`;

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

const chatHistories: Record<number, ChatHistoryItem[]> = {};
const chatLastActive: Record<number, number> = {};
let serverStartTime = Date.now();

const MAX_CHAT_HISTORY = 50;
const CHAT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function evictStaleChats() {
  const now = Date.now();
  const staleIds = Object.keys(chatLastActive)
    .map(Number)
    .filter(id => now - chatLastActive[id] > CHAT_TTL_MS);
  for (const id of staleIds) {
    delete chatHistories[id];
    delete chatLastActive[id];
  }
  // Also enforce max chat count
  const allIds = Object.keys(chatHistories).map(Number).sort((a, b) => chatLastActive[a] - chatLastActive[b]);
  while (allIds.length > MAX_CHAT_HISTORY) {
    const oldest = allIds.shift()!;
    delete chatHistories[oldest];
    delete chatLastActive[oldest];
  }
}

const supportKeyboard = {
  inline_keyboard: [
    [
      { text: '💨 Подобрать кальян/микс', callback_data: 'hookah_info' },
      { text: '📅 Забронировать столик', callback_data: 'booking_info' }
    ],
    [
      { text: '📍 Где мы находимся?', callback_data: 'location_info' },
      { text: '👑 Клубные привилегии', callback_data: 'club_info' }
    ],
    [
      { text: '🙋‍♂️ Позвать администратора', callback_data: 'call_admin' }
    ]
  ]
};

const HOOKAH_INFO = `💨 <b>Наши кальяны и секрет вкуса:</b>\n\nМы готовим кальяны по нашей фирменной технологии: <b>под баней (на 4 углях под колпаком)</b>.\nЭто обеспечивает идеальный и равномерный прогрев чаши, благодаря чему табак полностью раскрывается и отдает свою истинную крепость и яркий насыщенный вкус без перегрева и горечи!\n\n<b>Наши фирменные миксы:</b>\n• 🌅 <i>Чебоксарский закат</i> (Малина + Личи) — сочный, умеренно сладкий ягодный профиль с нежным послевкусием.\n• 🔥 <i>Sport Mix</i> (Арбуз + Дыня + Мята-Айс) — классическое освежающее летнее сочетание.\n• 💎 <i>Lounge Premium</i> (Кокос + Ваниль + Персик) — мягкий десертный микс для любителей нежных сливочных вкусов.\n\nВы также можете собрать свой собственный микс во Flask-микшере на нашем сайте!`;

const BOOKING_INFO = `📅 <b>Бронирование столов:</b>\n\nЗабронировать столик вы можете самостоятельно на нашем сайте с помощью интерактивной 3D-карты зала:\n🔗 <a href="https://cloudopus42-droid.github.io/sport-loungev3/booking">Забронировать столик на сайте</a>\n\n<b>Наши зоны:</b>\n• ⚡ <b>PRO 600Hz</b> — топовое геймерское железо с мониторами 600Гц.\n• 👑 <b>VIP PS</b> — приватный кабинет со сверхмягким диваном и консолью PlayStation 5.\n• 🎮 <b>PlayStation (2 этаж)</b> — комфортная зона для компании.\n• 🖥 <b>Общий зал</b> — мягкая лаунж-атмосфера и отличная музыка.`;

const LOCATION_INFO = `📍 <b>Наши контакты и адрес:</b>\n\n• 🗺 <b>Адрес:</b> г. Чебоксары, ул. Гагарина 40а\n• 🕐 <b>Режим работы:</b> Круглосуточно 24/7\n• 📱 <b>Контакты администратора:</b> @NHSC_founder\n\n📍 <a href="https://yandex.ru/maps/-/CDT1Z-pC">Открыть на Яндекс Картах</a>`;

const CLUB_INFO = `👑 <b>Клубные привилегии VIP Membership:</b>\n\nВ нашем клубе действует закрытая система лояльности. За каждое посещение, бронирование и отзывы вам начисляются баллы, повышающие ваш ранг:\n\n• 🥉 <b>Bronze</b> — Стартовый уровень.\n• 🥈 <b>Silver</b> — скидка 5% на все услуги.\n• 🥇 <b>Gold</b> — скидка 10%.\n• ⚽ <b>Black</b> — скидка 15%.\n• 💎 <b>Diamond Resident</b> — скидка 20% + бесплатные кастомные кальяны!\n\nВаш статус и цифровой QR-паспорт доступны в личном кабинете на сайте.`;

function addToHistory(chatId: number, role: 'user' | 'assistant', content: string) {
  if (!chatHistories[chatId]) {
    chatHistories[chatId] = [];
  }
  chatHistories[chatId].push({ role, content });
  if (chatHistories[chatId].length > 10) {
    chatHistories[chatId].shift();
  }
  chatLastActive[chatId] = Date.now();
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function callTelegramApi(method: string, body: any, timeoutMs = 5000): Promise<any> {
  const url = `${TELEGRAM_API_SUPPORT}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const data = await res.json() as any;
  if (data && data.ok) return data;
  throw new Error(data?.description || 'Telegram API returned ok: false');
}

async function getUpdates(offset: number, timeout = 30): Promise<any[]> {
  const url = `${TELEGRAM_API_SUPPORT}/getUpdates?offset=${offset}&timeout=${timeout}`;
  const res = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout((timeout + 5) * 1000)
  });
  const data = await res.json() as any;
  if (data && data.ok) return data.result || [];
  throw new Error(data?.description || 'Telegram returned ok: false');
}

async function notifyOwner(user: any, lastMessage: string) {
  const chatId = config.telegramChatId;
  if (!chatId) return;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const profileLink = `tg://user?id=${user.id}`;
  
  const text = [
    '🔔 <b>Запрос поддержки с Telegram-бота!</b>',
    '',
    `👤 <b>Имя:</b> ${escapeHtml(name)}`,
    `🔗 <b>Юзернейм:</b> ${user.username ? '@' + escapeHtml(user.username) : 'отсутствует'}`,
    `🆔 <b>ID пользователя:</b> <code>${user.id}</code>`,
    `💬 <b>Последнее сообщение:</b> <i>${escapeHtml(lastMessage)}</i>`,
    '',
    `🔗 <a href="${profileLink}">Открыть чат с пользователем</a>`
  ].join('\n');

  // Send via manager bot (support+master bot)
  if (MANAGER_BOT_TOKEN) {
    try {
      await fetch(`${TELEGRAM_API_MANAGER}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML'
        }),
        signal: AbortSignal.timeout(2500)
      });
      console.log('✅ Owner notified via manager bot');
    } catch (err: any) {
      console.error('⚠️ Failed to notify owner via manager bot:', err.message);
    }
  }
}

function getRulesResponse(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('добрый день') || lower.includes('добрый вечер')) {
    return 'greeting';
  }
  
  if (lower.includes('админ') || lower.includes('позови') || lower.includes('человек') || lower.includes('human') || lower.includes('оператор') || lower.includes('связаться') || lower.includes('помощь')) {
    return 'call_admin_trigger';
  }
  
  if (lower.includes('кальян') || lower.includes('микс') || lower.includes('табак') || lower.includes('уг') || lower.includes('бан') || lower.includes('вкус')) {
    return 'hookah_info_trigger';
  }
  
  if (lower.includes('бронь') || lower.includes('забронировать') || lower.includes('стол') || lower.includes('мест') || lower.includes('заказ')) {
    return 'booking_info_trigger';
  }
  
  if (lower.includes('где') || lower.includes('адрес') || lower.includes('находитесь') || lower.includes('улиц') || lower.includes('гагарин') || lower.includes('карт')) {
    return 'location_info_trigger';
  }
  
  if (lower.includes('клуб') || lower.includes('карт') || lower.includes('скид') || lower.includes('лояльност') || lower.includes('привилег') || lower.includes('vip')) {
    return 'club_info_trigger';
  }
  
  return 'default';
}

async function askOpenAI(message: string, history: ChatHistoryItem[]): Promise<string | null> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return null;

  try {
    const systemPrompt = `Вы — профессиональный и элитный менеджер службы поддержки SPORT LOUNGE (круглосуточный премиальный лаунж компьютерный клуб и кальянная).
Ваш тон изысканный, вежливый, приветливый и премиальный. Отвечайте коротко и структурировано. Используйте эмодзи для красоты. Отвечайте строго на русском языке.

Информация о заведении:
- Адрес: г. Чебоксары, ул. Гагарина 40а.
- Режим работы: Круглосуточно 24/7.
- Особенность кальянов: готовим на 4 углях под баней (под колпаком), благодаря чему чаша прогревается идеально равномерно, табак раскрывается полностью и дает свою истинную крепость и насыщенность вкуса без перегрева.
- Бронирование столов: осуществляется на сайте https://cloudopus42-droid.github.io/sport-loungev3/booking через интерактивную 3D-карту зала.
- Зоны: Общий лаунж-зал, VIP-комнаты с PlayStation 5 (VIP PS), PRO PC зона (мониторы 600Hz), OLED 4K экраны.
- Лояльность: VIP Membership с уровнями Bronze -> Silver (5%) -> Gold (10%) -> Black (15%) -> Diamond Resident (20% скидка на всё и бесплатные кастомные кальяны).

Если пользователь просит позвать человека, администратора, или если вы не можете ответить на вопрос, обязательно скажите ему, что вы позвали администратора, и он скоро напишет в личные сообщения.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (res.ok) {
      const data = await res.json() as any;
      return data.choices[0].message.content;
    }
  } catch (err: any) {
    console.warn('⚠️ OpenAI API call failed in support bot:', err.message);
  }
  return null;
}

async function handleUpdate(update: any) {
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from;

    if (!user) return;

    // Skip old messages
    if (message.date && message.date * 1000 < serverStartTime - 300000) {
      console.log(`⏳ Skipping old support message from ${user.first_name}`);
      return;
    }

    console.log(`✉️ [Support Bot] Message from ${user.first_name} (${chatId}): "${text}"`);

    // Handle /start command
    if (text.startsWith('/start')) {
      const welcomeText = `👋 <b>Добро пожаловать в Sport Lounge!</b>\n\nЯ — ваш персональный ИИ-менеджер поддержки. Моя задача — помочь вам сделать отдых идеальным и ответить на любые вопросы.\n\nВыберите интересующий раздел меню или напишите ваш вопрос текстом:`;
      await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard
      });
      return;
    }

    addToHistory(chatId, 'user', text);

    const ruleTrigger = getRulesResponse(text);

    if (ruleTrigger === 'call_admin_trigger') {
      await notifyOwner(user, text);
      const reply = `🔔 <b>Запрос отправлен!</b>\n\nЯ уведомил администратора клуба. Он свяжется с вами в личных сообщениях в ближайшее время.`;
      await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: reply,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard
      });
      addToHistory(chatId, 'assistant', reply);
      return;
    }

    if (ruleTrigger !== 'default') {
      let replyText = '';
      if (ruleTrigger === 'greeting') {
        replyText = `👋 <b>Приветствуем вас в службе поддержки SPORT LOUNGE!</b>\n\nЯ — ваш автоматический ИИ-помощник. Я знаю всё о наших кальянах, зонах, адресе и бронировании столов.\n\nЧем я могу помочь вам сегодня? Воспользуйтесь меню или просто напишите ваш вопрос.`;
      } else if (ruleTrigger === 'hookah_info_trigger') {
        replyText = HOOKAH_INFO;
      } else if (ruleTrigger === 'booking_info_trigger') {
        replyText = BOOKING_INFO;
      } else if (ruleTrigger === 'location_info_trigger') {
        replyText = LOCATION_INFO;
      } else if (ruleTrigger === 'club_info_trigger') {
        replyText = CLUB_INFO;
      }

      await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard
      });
      addToHistory(chatId, 'assistant', replyText);
      return;
    }

    // Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      const history = chatHistories[chatId] || [];
      const aiReply = await askOpenAI(text, history.slice(0, -1));
      if (aiReply) {
        const lowerReply = aiReply.toLowerCase();
        if (lowerReply.includes('позвал администратора') || lowerReply.includes('администратор свяжется')) {
          await notifyOwner(user, text);
        }

        await callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: aiReply,
          parse_mode: 'HTML',
          reply_markup: supportKeyboard
        });
        addToHistory(chatId, 'assistant', aiReply);
        return;
      }
    }

    // Fallback
    const defaultReply = `🤖 <b>Я — автоматический ассистент SPORT LOUNGE.</b>\n\nК сожалению, я не совсем понял ваш вопрос.\n\nВы можете воспользоваться кнопками ниже для быстрого получения информации или нажать кнопку <b>«🙋‍♂️ Позвать администратора»</b>, чтобы он связался с вами лично!`;
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: defaultReply,
      parse_mode: 'HTML',
      reply_markup: supportKeyboard
    });
    addToHistory(chatId, 'assistant', defaultReply);
  } 
  
  else if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const user = callbackQuery.from;

    if (!user) return;

    console.log(`🖱️ [Support Bot] Button click from ${user.first_name}: "${data}"`);

    try {
      await callTelegramApi('answerCallbackQuery', {
        callback_query_id: callbackQuery.id
      });
    } catch (err: any) {
      console.warn('⚠️ answerCallbackQuery failed:', err.message);
    }

    let replyText = '';
    
    if (data === 'hookah_info') {
      replyText = HOOKAH_INFO;
    } else if (data === 'booking_info') {
      replyText = BOOKING_INFO;
    } else if (data === 'location_info') {
      replyText = LOCATION_INFO;
    } else if (data === 'club_info') {
      replyText = CLUB_INFO;
    } else if (data === 'call_admin') {
      await notifyOwner(user, 'Нажата кнопка "Позвать администратора"');
      replyText = `🔔 <b>Запрос отправлен!</b>\n\nЯ уведомил администратора клуба. Он свяжется с вами в личных сообщениях в ближайшее время.`;
    }

    if (replyText) {
      await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard
      });
      addToHistory(chatId, 'assistant', replyText);
    }
  }
}

export function startSupportBot() {
  serverStartTime = Date.now();
  console.log('🤖 [Support Bot] Starting service...');

  let offset = 0;
  let isPolling = true;

  let evictionCounter = 0;

  // Polling loop
  const poll = async () => {
    while (isPolling) {
      try {
        const updates = await getUpdates(offset, 25);
        for (const update of updates) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
        // Evict stale chats every ~5 minutes (every 12 polls at 25s each)
        if (++evictionCounter % 12 === 0) {
          evictStaleChats();
        }
      } catch (err: any) {
        if (err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('Abort')) {
          continue;
        }
        console.error('⚠️ [Support Bot] Polling loop error, retrying in 10s:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  };

  poll().catch((err) => {
    console.error('🚨 [Support Bot] Fatal error in polling loop context:', err);
  });

  return () => {
    isPolling = false;
    console.log('🔌 [Support Bot] Service stopped.');
  };
}
