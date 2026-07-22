import { Router, Request, Response, NextFunction } from 'express';
import { createPromoSchema } from '../schemas/promo.schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { uploadSingle, uploadToSupabase, deleteFromSupabase } from '../middleware/upload';
import { supabase } from '../config/supabase';

const router = Router();

function mapPromoToFrontend(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    imageUrl: p.image_url,
    discountPercent: p.discount_percent,
    badgeColor: p.badge_color,
    priority: p.priority,
    startDate: p.start_date,
    endDate: p.end_date,
    isActive: p.is_active,
    createdAt: p.created_at,
  };
}

// GET /api/promos — Public, active promos only
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date().toISOString();

    // Фильтр: isActive = true AND (startDate IS NULL OR startDate <= now) AND (endDate IS NULL OR endDate >= now)
    const { data: promos, error } = await supabase
      .from('promos')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((promos || []).map(mapPromoToFrontend));
  } catch (error) {
    next(error);
  }
});

// GET /api/promos/all — Auth + Admin, all promos
router.get('/all', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: promos, error } = await supabase
      .from('promos')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((promos || []).map(mapPromoToFrontend));
  } catch (error) {
    next(error);
  }
});

// POST /api/promos — Auth + Admin + upload
router.post(
  '/',
  auth,
  isAdmin,
  uploadSingle('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createPromoSchema.parse(req.body);
      const imageUrl = req.file ? await uploadToSupabase(req.file, 'promos') : undefined;

      const { data: promo, error } = await supabase
        .from('promos')
        .insert({
          title: data.title,
          description: data.description,
          image_url: imageUrl,
          discount_percent: data.discountPercent,
          badge_color: data.badgeColor || '#00f2fe',
          priority: data.priority || 0,
          start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
          end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
          is_active: data.isActive !== undefined ? data.isActive : true,
        })
        .select()
        .single();

      if (error || !promo) {
        res.status(500).json({ error: 'Не удалось создать акцию: ' + error?.message });
        return;
      }

      res.status(201).json(mapPromoToFrontend(promo));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/promos/:id — Auth + Admin + upload
router.put(
  '/:id',
  auth,
  isAdmin,
  uploadSingle('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createPromoSchema.partial().parse(req.body);
      const updateData: any = {
        title: data.title,
        description: data.description,
        discount_percent: data.discountPercent,
        badge_color: data.badgeColor,
        priority: data.priority,
        is_active: data.isActive,
      };

      if (data.startDate !== undefined) {
        updateData.start_date = data.startDate ? new Date(data.startDate).toISOString() : null;
      }
      if (data.endDate !== undefined) {
        updateData.end_date = data.endDate ? new Date(data.endDate).toISOString() : null;
      }

      if (req.file) {
        const { data: oldPromo } = await supabase
          .from('promos')
          .select('image_url')
          .eq('id', req.params.id)
          .maybeSingle();

        if (oldPromo?.image_url) {
          await deleteFromSupabase(oldPromo.image_url);
        }

        updateData.image_url = await uploadToSupabase(req.file, 'promos');
      }

      // Удаляем undefined значения из объекта обновления
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      const { data: promo, error } = await supabase
        .from('promos')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !promo) {
        res.status(404).json({ error: 'Акция не найдена', status: 404 });
        return;
      }

      res.json(mapPromoToFrontend(promo));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/promos/:id — Auth + Admin
router.delete(
  '/:id',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: promo, error: fetchError } = await supabase
        .from('promos')
        .select('image_url')
        .eq('id', req.params.id)
        .maybeSingle();

      if (fetchError || !promo) {
        res.status(404).json({ error: 'Акция не найдена', status: 404 });
        return;
      }

      if (promo.image_url) {
        await deleteFromSupabase(promo.image_url);
      }

      const { error: deleteError } = await supabase
        .from('promos')
        .delete()
        .eq('id', req.params.id);

      if (deleteError) {
        res.status(500).json({ error: deleteError.message });
        return;
      }

      res.json({ message: 'Акция удалена' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/promos/bulk-delete — Delete multiple promos by IDs
router.post('/bulk-delete', auth, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    const { data: items } = await supabase
      .from('promos')
      .select('id, image_url')
      .in('id', ids);

    if (items) {
      for (const item of items) {
        if (item.image_url) {
          await deleteFromSupabase(item.image_url).catch(() => {});
        }
      }
    }

    const { error } = await supabase
      .from('promos')
      .delete()
      .in('id', ids);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ deleted: ids.length });
  } catch (e) { next(e); }
});

export default router;
