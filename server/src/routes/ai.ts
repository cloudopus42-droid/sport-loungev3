import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { sendChatMessageNotification } from '../services/telegram';

const router = Router();

// OpenAI integration check
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Zod validation schemas
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).default([])
});

const dnaSchema = z.object({
  flavors: z.array(z.string()),
  percentages: z.record(z.string(), z.number())
});

// POST /api/ai/chat — Luxury Concierge assistant chat
router.post('/chat', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = chatSchema.parse(req.body);
    const msgLower = message.toLowerCase();

    // Fetch user details for Telegram notification
    const { data: dbUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', req.user!.id)
      .maybeSingle();

    const userName = dbUser?.name || 'Пользователь';

    // Send Telegram notification in background
    sendChatMessageNotification(userName, req.user!.email, message).catch((err) => {
      console.error('⚠️ Failed to send Telegram chat notification:', err);
    });

    // 1. Fallback Luxury Sommelier Rules Engine
    let responseText = '';

    if (msgLower.includes('привет') || msgLower.includes('здравствуй') || msgLower.includes('hello') || msgLower.includes('hi')) {
      responseText = `Приветствую вас в SPORT LOUNGE, ${(req.user as any)?.name || 'дорогой гость'}. Я — ваш персональный ИИ-консьерж. Моя задача — сделать ваш отдых безупречным. Желаете подобрать идеальный столик на вечер, составить эксклюзивный авторский микс кальяна или узнать о наших клубных привилегиях?`;
    } else if (msgLower.includes('стол') || msgLower.includes('карт') || msgLower.includes('мест') || msgLower.includes('зона') || msgLower.includes('бронир')) {
      responseText = `С удовольствием помогу выбрать идеальное место. 
\n• Для любителей премиального гейминга рекомендую **PRO 600Hz** или **OLED 4K** с высокопроизводительными системами.
\n• Для уединенного отдыха и глубокого расслабления идеально подойдет **VIP PS** — приватный кабинет со сверхмягким диваном и консолью PS5.
\n• В общем зале (**Общий зал**) царит легкая лаунж-атмосфера.
\nВы можете кликнуть на любой свободный столик на нашей интерактивной 3D-карте зала прямо сейчас, чтобы сразу забронировать его!`;
    } else if (msgLower.includes('кальян') || msgLower.includes('табак') || msgLower.includes('микс') || msgLower.includes('вкус') || msgLower.includes('забив')) {
      responseText = `Как сертифицированный ИИ-сомелье кальянов, я рекомендую попробовать наши фирменные сочетания:
\n• **"Чебоксарский закат"** (Малина + Личи) — сочный, умеренно сладкий ягодный профиль с нежным цветочным послевкусием.
\n• **"Sport Mix"** (Арбуз + Дыня + Мята-Айс) — классическое освежающее летнее сочетание, дающее плотный и насыщенный дым.
\n• **"Lounge Premium"** (Кокос + Ваниль + Персик) — мягкий десертный микс для ценителей нежных, сливочных вкусов.
\nВы можете собрать свой микс в нашем интерактивном Flask Mixologist, отрегулировав проценты, а наш 3D DNA-анализатор вкуса сразу покажет молекулярную карту вашей чаши!`;
    } else if (msgLower.includes('сладк') || msgLower.includes('ягод') || msgLower.includes('десерт')) {
      responseText = `Для ценителей сладкого я рекомендую десертный бленд **"Кокос-Ваниль"** или ягодный микс **"Малина-Личи"**. Они создают густой карамельно-фруктовый пар и прекрасно гармонируют со средним уровнем крепости. Добавить ли их в ваш заказ?`;
    } else if (msgLower.includes('свеж') || msgLower.includes('холод') || msgLower.includes('айс') || msgLower.includes('лед')) {
      responseText = `Если вы предпочитаете морозную свежесть, обратите внимание на наш освежающий **"Кактус-Фрост"** или классический **"Мята-Айс"**. Они моментально тонизируют, очищают вкусовые рецепторы и дают леденящее горло послевкусие. Рекомендую добавить около 20% свежести в чашу для идеального баланса!`;
    } else if (msgLower.includes('крепк') || msgLower.includes('сильн') || msgLower.includes('strong')) {
      responseText = `Для любителей высокой крепости и плотного никотинового насыщения у нас есть премиальные табачные линейки. Рекомендую забивку уровня **Strong** с использованием нашего фирменного **Sport Mix** на глиняной чаше типа "Turkish". Это обеспечит глубокий, насыщенный прогрев и мягкий, но крепкий удар по горлу.`;
    } else if (msgLower.includes('музык') || msgLower.includes('плейлист') || msgLower.includes('трек')) {
      responseText = `В нашем лаунже звучит тщательно отобранный легкий дип-хаус, органик-хаус и чиллаут-аудиопоток, создающий атмосферу полного погружения. Вы можете включить проигрыватель прямо в верхнем углу шапки нашего сайта и наблюдать, как наши золотые фоновые частицы начинают танцевать и пульсировать в такт битам!`;
    } else if (msgLower.includes('привилег') || msgLower.includes('клуб') || msgLower.includes('карт') || msgLower.includes('статус') || msgLower.includes('скид')) {
      responseText = `В SPORT LOUNGE действует закрытая клубная система **VIP Membership**. 
\nЗа каждое бронирование, отзывы и активность вам начисляются баллы лояльности. 
\nВы продвигаетесь по уровням: **Bronze** -> **Silver** (5% скидка) -> **Gold** (10% скидка) -> **Black** (15% скидка) -> **Diamond Resident** (20% скидка на всё и бесплатные кастомные кальяны!). Ваш цифровой паспорт и ачивки доступны в личном кабинете.`;
    } else {
      responseText = `Я с большим удовольствием помогу сделать ваш отдых в SPORT LOUNGE идеальным. Уточните, пожалуйста, вы бы хотели подобрать комфортную зону (у нас есть VIP кабинеты с PS5, 600Hz PC-зона и общий зал), разработать уникальную вкусовую чашу в Flask-микшере или узнать баланс вашей клубной карты лояльности?`;
    }

    // 2. OpenAI implementation if key is present
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are the elite AI Concierge for "SPORT LOUNGE", a high-end luxury private hookah & computer lounge. Your tone is extremely sophisticated, professional, polite, and atmospheric (inspired by Soho House, Rolls-Royce Bespoke, and Aman Resorts). Speak Russian. Keep answers concise, formatted, and elegant.
                Refer to these club details:
                - Address: г. Чебоксары, ул. Гагарина 40а.
                - Working Hours: 24/7.
                - Premium zones: PC Zone (600Hz), PlayStation (2nd floor, VIP PS), Rooms ( corridor rooms, OLED 4K screens).
                - Signature mixes: "Чебоксарский закат" (Raspberry + Lychee), "Sport Mix" (Watermelon + Melon + Ice), "Lounge Premium" (Coconut + Vanilla + Peach).
                - VIP Membership: Levels are Bronze, Silver (5% off), Gold (10% off), Black (15% off), Diamond (20% off).
                - Suggest booking via the interactive 3D floor map.
                Always be helpful, warm, and elite.`
              },
              ...history.map(h => ({ role: h.role, content: h.content })),
              { role: 'user', content: message }
            ]
          })
        });

        if (response.ok) {
          const aiData = (await response.json()) as any;
          responseText = aiData.choices[0].message.content;
        }
      } catch (err) {
        console.warn('⚠️ OpenAI connection failed, using local sommelier engine:', err);
      }
    }

    res.json({ response: responseText });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/flavor-dna — Custom mix taste DNA profiling
router.post('/flavor-dna', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { flavors, percentages } = dnaSchema.parse(req.body);

    let sweetness = 0;
    let freshness = 0;
    let sourness = 0;
    let strength = 50; // Base strength

    flavors.forEach(name => {
      const pct = (percentages[name] || 0) / 100;
      
      // Calculate flavor profiles mathematically
      if (name.includes('яблоко') || name.includes('Манго') || name.includes('Персик') || name.includes('Дыня') || name.includes('Банан') || name.includes('Кокос')) {
        sweetness += 80 * pct;
        if (name.includes('яблоко') || name.includes('Персик')) sourness += 25 * pct;
      } else if (name.includes('Ягоды') || name.includes('Клубника') || name.includes('Черника') || name.includes('Малина')) {
        sweetness += 55 * pct;
        sourness += 45 * pct;
      } else if (name.includes('Лимон') || name.includes('Грейпфрут')) {
        sourness += 85 * pct;
        sweetness += 15 * pct;
      } else if (name.includes('Мята') || name.includes('Айс') || name.includes('Фрост')) {
        freshness += 90 * pct;
      } else if (name.includes('Sport') || name.includes('sunset') || name.includes('Lounge')) {
        sweetness += 50 * pct;
        freshness += 30 * pct;
        sourness += 20 * pct;
      }
    });

    const finalSweetness = Math.min(100, Math.round(sweetness));
    const finalFreshness = Math.min(100, Math.round(freshness));
    const finalSourness = Math.min(100, Math.round(sourness));
    const finalStrength = Math.min(100, Math.round(strength + (finalFreshness * 0.1)));

    // Generate somatic sommelier review text
    let review = '';
    if (finalSweetness > 60 && finalFreshness > 40) {
      review = 'Сбалансированный ягодно-морозный нектар с приятным карамельным послевкусием.';
    } else if (finalSweetness > 70) {
      review = 'Насыщенный десертно-фруктовый нектар с глубокими сладкими нотами.';
    } else if (finalFreshness > 70) {
      review = 'Экстремально бодрящий, леденящий бленд для ценителей арктического холода.';
    } else if (finalSourness > 65) {
      review = 'Яркий цитрусовый профиль с тонизирующей кислинкой, отлично раскрывающийся на глиняной чаше.';
    } else {
      review = 'Классический сбалансированный лаунж-микс с бархатистым ровным вкусом.';
    }

    res.json({
      dna: {
        sweetness: finalSweetness,
        freshness: finalFreshness,
        sourness: finalSourness,
        strength: finalStrength,
      },
      review
    });
  } catch (error) {
    next(error);
  }
});

export default router;
