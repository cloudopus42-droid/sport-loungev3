import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const DEFAULT_SHOWCASE_SETTINGS = {
  enabled: true,
  topCount: 6,
  background: 'dark',
};

async function getShowcaseSettings() {
  const { data } = await supabase
    .from('smart_features')
    .select('enabled, config')
    .eq('feature_key', 'homepage_showcase')
    .maybeSingle();

  if (!data) return DEFAULT_SHOWCASE_SETTINGS;

  const config = (data.config || {}) as Record<string, unknown>;
  return {
    enabled: data.enabled !== false,
    topCount: typeof config.topCount === 'number' ? config.topCount : DEFAULT_SHOWCASE_SETTINGS.topCount,
    background: typeof config.background === 'string' ? config.background : DEFAULT_SHOWCASE_SETTINGS.background,
  };
}

const showcaseUploadDir = path.resolve(__dirname, '../../uploads/showcases');
try {
  if (!fs.existsSync(showcaseUploadDir)) {
    fs.mkdirSync(showcaseUploadDir, { recursive: true });
  }
} catch {
  // parent dir may not exist yet; app.ts will handle creation
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, showcaseUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function mapShowcaseToFrontend(s: any) {
  if (!s) return null;
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    imageUrl: s.image_url,
    order: s.sort_order,
    isActive: s.is_active,
    createdAt: s.created_at,
  };
}

function mapShowcaseToDb(body: any) {
  const dbData: any = {};
  if (body.title !== undefined) dbData.title = body.title;
  if (body.description !== undefined) dbData.description = body.description;
  if (body.imageUrl !== undefined) dbData.image_url = body.imageUrl;
  if (body.order !== undefined) dbData.sort_order = Number(body.order);
  if (body.isActive !== undefined) dbData.is_active = Boolean(body.isActive);
  return dbData;
}

// GET /api/showcases/settings — public showcase display settings
router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getShowcaseSettings());
  } catch (e) {
    next(e);
  }
});

// PUT /api/showcases/settings — admin: update showcase display settings
router.put('/settings', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled, topCount, background } = req.body || {};
    const config = {
      topCount: Math.min(20, Math.max(1, Number(topCount) || DEFAULT_SHOWCASE_SETTINGS.topCount)),
      background: typeof background === 'string' ? background : DEFAULT_SHOWCASE_SETTINGS.background,
    };

    const { data, error } = await supabase
      .from('smart_features')
      .upsert(
        {
          feature_key: 'homepage_showcase',
          name: 'Витрина на главной',
          description: 'Настройки блока витрины на главной странице',
          enabled: enabled !== false,
          is_public: true,
          config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'feature_key' }
      )
      .select('enabled, config')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const savedConfig = (data?.config || {}) as Record<string, unknown>;
    res.json({
      enabled: data?.enabled !== false,
      topCount: typeof savedConfig.topCount === 'number' ? savedConfig.topCount : config.topCount,
      background: typeof savedConfig.background === 'string' ? savedConfig.background : config.background,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/showcases/manage — admin: all showcase items
router.get('/manage', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: items, error } = await supabase
      .from('showcases')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((items || []).map(mapShowcaseToFrontend));
  } catch (e) {
    next(e);
  }
});

// GET /api/showcases — public, active showcases sorted by order
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getShowcaseSettings();
    if (!settings.enabled) {
      res.json([]);
      return;
    }

    const { data: items, error } = await supabase
      .from('showcases')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(settings.topCount);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((items || []).map(mapShowcaseToFrontend));
  } catch (e) {
    next(e);
  }
});

// POST /api/showcases — admin
router.post('/', auth, isAdmin, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.file) {
      req.body.imageUrl = `/uploads/showcases/${req.file.filename}`;
    }

    const dbData = mapShowcaseToDb(req.body);

    const { data: item, error } = await supabase
      .from('showcases')
      .insert(dbData)
      .select()
      .single();

    if (error || !item) {
      res.status(500).json({ error: 'Не удалось создать элемент витрины: ' + error?.message });
      return;
    }

    res.status(201).json(mapShowcaseToFrontend(item));
  } catch (e) {
    next(e);
  }
});

// PUT /api/showcases/reorder — admin: update sort_order for multiple items
router.put('/reorder', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Ожидается массив { _id, order }' });
      return;
    }

    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let failed = false;

      for (const item of items) {
        const id = item._id || item.id;
        if (!id) continue;
        const { error } = await supabase
          .from('showcases')
          .update({ sort_order: item.order })
          .eq('id', id);

        if (error) {
          failed = true;
          if (attempt < MAX_RETRIES) {
            console.warn(`⚠️ [Showcase] Reorder attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
            await new Promise(r => setTimeout(r, 200 * attempt));
          } else {
            res.status(500).json({ error: 'Не удалось обновить порядок: ' + error.message });
            return;
          }
          break;
        }
      }

      if (!failed) break;
    }

    const { data: updated } = await supabase
      .from('showcases')
      .select('*')
      .order('sort_order', { ascending: true });

    res.json((updated || []).map(mapShowcaseToFrontend));
  } catch (e) {
    next(e);
  }
});

// PUT /api/showcases/:id — admin
router.put('/:id', auth, isAdmin, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.file) {
      req.body.imageUrl = `/uploads/showcases/${req.file.filename}`;
    }

    const dbData = mapShowcaseToDb(req.body);

    const { data: item, error } = await supabase
      .from('showcases')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !item) {
      res.status(404).json({ error: 'Не найдено или ошибка обновления' });
      return;
    }

    res.json(mapShowcaseToFrontend(item));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/showcases/:id — admin
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('showcases')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Удалено' });
  } catch (e) {
    next(e);
  }
});

export default router;
