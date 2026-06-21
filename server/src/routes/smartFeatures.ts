import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

const updateFeatureSchema = z.object({
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional(),
});

function mapFeature(f: any) {
  return {
    id: f.id,
    featureKey: f.feature_key,
    name: f.name,
    description: f.description,
    enabled: f.enabled,
    isPublic: f.is_public,
    config: f.config,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}

// GET /api/smart-features — Admin: list all features
router.get('/', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('smart_features')
      .select('*')
      .order('feature_key');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((data || []).map(mapFeature));
  } catch (error) {
    next(error);
  }
});

// PUT /api/smart-features/:id — Admin: update enabled + config
router.put('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateFeatureSchema.parse(req.body);

    const { data, error } = await supabase
      .from('smart_features')
      .update({ enabled: body.enabled, config: body.config ?? {}, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Фича не найдена', status: 404 });
      return;
    }

    res.json(mapFeature(data));
  } catch (error) {
    next(error);
  }
});

// GET /api/smart-features/status — Public: returns { feature_key: { enabled, config } }
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('smart_features')
      .select('feature_key, enabled, config, is_public');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const result: Record<string, { enabled: boolean; config: any }> = {};
    for (const f of data || []) {
      if (f.is_public || f.enabled) {
        result[f.feature_key] = { enabled: f.enabled, config: f.config };
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

/**
 * Seed 10 smart features into the database.
 * Called once on server startup.
 */
const FEATURES = [
  { feature_key: 'ai_recommendations', name: 'ИИ-рекомендации', description: 'Персонализированные рекомендации на основе ИИ', enabled: false, is_public: true },
  { feature_key: 'loyalty_program', name: 'Программа лояльности', description: 'Баллы, уровни и привилегии для постоянных клиентов', enabled: false, is_public: true },
  { feature_key: 'push_notifications', name: 'Push-уведомления', description: 'Уведомления о статусе заказа и акциях', enabled: false, is_public: false },
  { feature_key: 'referral_system', name: 'Реферальная система', description: 'Приглашайте друзей и получайте бонусы', enabled: false, is_public: true },
  { feature_key: 'birthday_bonus', name: 'Именинный бонус', description: 'Автоматический бонус в день рождения', enabled: false, is_public: true },
  { feature_key: 'advanced_analytics', name: 'Расширенная аналитика', description: 'Детальная статистика и отчёты для администратора', enabled: false, is_public: false },
  { feature_key: 'auto_restock', name: 'Авто-заказ табака', description: 'Автоматическое создание заявок на пополнение табака', enabled: false, is_public: false },
  { feature_key: 'telegram_notifications', name: 'Telegram-уведомления', description: 'Уведомления о заказах через Telegram-бота', enabled: false, is_public: false },
  { feature_key: 'concierge_chat', name: 'Консьерж-чат', description: 'Чат с поддержкой в реальном времени', enabled: false, is_public: true },
  { feature_key: 'dynamic_pricing', name: 'Динамическое ценообразование', description: 'Автоматическая корректировка цен', enabled: false, is_public: false },
  { feature_key: 'ai_sommelier', name: 'ИИ-Сомелье', description: 'Рекомендации напитков к кальяну на основе вкусовых предпочтений', enabled: false, is_public: true },
  { feature_key: 'auto_discount_night', name: 'Ночная скидка', description: 'Автоматическое применение скидки 15% на заказы после 23:00', enabled: false, is_public: false },
  { feature_key: 'qr_menu', name: 'QR-меню', description: 'Гости сканируют QR-код на столе для просмотра меню и заказа', enabled: true, is_public: true },
];

export async function seedSmartFeatures(): Promise<void> {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('smart_features')
      .select('feature_key')
      .limit(1);

    if (checkError) {
      console.warn(`⚠️ Cannot seed smart_features: ${checkError.message}`);
      return;
    }

    if (existing && existing.length > 0) {
      return;
    }

    for (const feature of FEATURES) {
      const { error } = await supabase
        .from('smart_features')
        .upsert(
          { ...feature, updated_at: new Date().toISOString() },
          { onConflict: 'feature_key' }
        );

      if (error && !error.message.includes('row-level security')) {
        console.warn(`⚠️ Failed to seed feature "${feature.feature_key}":`, error.message);
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to seed smart features:', err.message);
  }
}
