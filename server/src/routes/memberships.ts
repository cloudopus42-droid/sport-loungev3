import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/memberships/me - Get current user membership level and loyalty points
router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Fetch user's membership and nested membership details
    let { data: userMem, error } = await supabase
      .from('users_membership')
      .select('points, memberships (*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!userMem) {
      // Auto-assign Bronze membership if none exists yet
      const { data: bronzeMem, error: bronzeError } = await supabase
        .from('memberships')
        .select('*')
        .eq('level', 'bronze')
        .single();

      if (bronzeError || !bronzeMem) {
        res.status(500).json({ error: 'Bronze membership tier not found in DB.' });
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('users_membership')
        .insert({
          user_id: userId,
          membership_id: bronzeMem.id,
          points: 0
        })
        .select('points, memberships (*)')
        .single();

      if (insertError) {
        res.status(500).json({ error: insertError.message });
        return;
      }

      userMem = inserted;
    }

    res.json(userMem);
  } catch (error) {
    next(error);
  }
});

// GET /api/memberships/achievements - Get all achievements with unlocked statuses
router.get('/achievements', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Fetch all achievements
    const { data: allAchievements, error: achError } = await supabase
      .from('achievements')
      .select('*')
      .order('points_reward', { ascending: true });

    if (achError) {
      res.status(500).json({ error: achError.message });
      return;
    }

    // Fetch user's unlocks
    const { data: unlocks, error: unlockError } = await supabase
      .from('achievement_unlocks')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    if (unlockError) {
      res.status(500).json({ error: unlockError.message });
      return;
    }

    const unlockMap = new Map(unlocks.map((u: any) => [u.achievement_id, u.unlocked_at]));

    const mapped = allAchievements.map((ach: any) => ({
      ...ach,
      unlocked: unlockMap.has(ach.id),
      unlockedAt: unlockMap.get(ach.id) || null
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// GET /api/memberships/loyalty - Fetch loyalty points transaction logs
router.get('/loyalty', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/memberships/favorites - Get user favorite tables and hookah flavors
router.get('/favorites', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const { data: tables, error: tableError } = await supabase
      .from('favorite_tables')
      .select('seat_id, created_at')
      .eq('user_id', userId);

    const { data: flavors, error: flavorError } = await supabase
      .from('favorite_flavors')
      .select('flavor_name, created_at')
      .eq('user_id', userId);

    if (tableError || flavorError) {
      res.status(500).json({ error: tableError?.message || flavorError?.message });
      return;
    }

    res.json({
      tables: tables.map((t: any) => t.seat_id),
      flavors: flavors.map((f: any) => f.flavor_name)
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/memberships/favorite-table - Toggle favorite table
router.post('/favorite-table', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { seatId } = req.body;

    if (!seatId) {
      res.status(400).json({ error: 'Seat ID required' });
      return;
    }

    const { data: existing, error: checkError } = await supabase
      .from('favorite_tables')
      .select('seat_id')
      .eq('user_id', userId)
      .eq('seat_id', seatId)
      .maybeSingle();

    if (checkError) {
      res.status(500).json({ error: checkError.message });
      return;
    }

    if (existing) {
      await supabase
        .from('favorite_tables')
        .delete()
        .eq('user_id', userId)
        .eq('seat_id', seatId);

      res.json({ status: 'removed', seatId });
    } else {
      await supabase
        .from('favorite_tables')
        .insert({ user_id: userId, seat_id: seatId });

      res.json({ status: 'added', seatId });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/memberships/favorite-flavor - Toggle favorite hookah flavor
router.post('/favorite-flavor', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { flavorName } = req.body;

    if (!flavorName) {
      res.status(400).json({ error: 'Flavor name required' });
      return;
    }

    const { data: existing, error: checkError } = await supabase
      .from('favorite_flavors')
      .select('flavor_name')
      .eq('user_id', userId)
      .eq('flavor_name', flavorName)
      .maybeSingle();

    if (checkError) {
      res.status(500).json({ error: checkError.message });
      return;
    }

    if (existing) {
      await supabase
        .from('favorite_flavors')
        .delete()
        .eq('user_id', userId)
        .eq('flavor_name', flavorName);

      res.json({ status: 'removed', flavorName });
    } else {
      await supabase
        .from('favorite_flavors')
        .insert({ user_id: userId, flavor_name: flavorName });

      res.json({ status: 'added', flavorName });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/memberships/reviews - Leave a review for a completed booking & award points
router.post('/reviews', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { bookingId, rating, text } = req.body;

    if (!bookingId || !rating) {
      res.status(400).json({ error: 'Booking ID and rating are required' });
      return;
    }

    // Verify booking belongs to user
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .maybeSingle();

    if (bookingErr || !booking) {
      res.status(404).json({ error: 'Booking not found or not owned by user' });
      return;
    }

    // Insert review
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        rating,
        text
      })
      .select()
      .single();

    if (reviewErr) {
      res.status(409).json({ error: 'Вы уже оставили отзыв для этого бронирования.' });
      return;
    }

    // Reward points for leaving a review (50 points)
    const pointsAward = 50;

    // Check if the 'elite_member' achievement is already unlocked
    const { data: achievement } = await supabase
      .from('achievements')
      .select('*')
      .eq('code', 'elite_member')
      .single();

    if (achievement) {
      const { data: alreadyUnlocked } = await supabase
        .from('achievement_unlocks')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .maybeSingle();

      if (!alreadyUnlocked) {
        // Unlock achievement
        await supabase
          .from('achievement_unlocks')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });

        // Add achievement points
        const totalAward = pointsAward + achievement.points_reward;

        // Log loyalty transaction
        await supabase.from('loyalty_transactions').insert([
          { user_id: userId, points_delta: pointsAward, description: 'Отзыв о посещении клуба', type: 'earn' },
          { user_id: userId, points_delta: achievement.points_reward, description: 'Ачивка: Элитный Член Клуба', type: 'earn' }
        ]);

        // Increment points in profile membership
        const { data: currentMem } = await supabase
          .from('users_membership')
          .select('points')
          .eq('user_id', userId)
          .single();

        const currentPoints = (currentMem?.points || 0) + totalAward;

        // Determine new membership level based on currentPoints
        let targetLevel = 'bronze';
        if (currentPoints >= 5000) targetLevel = 'diamond';
        else if (currentPoints >= 1500) targetLevel = 'black';
        else if (currentPoints >= 500) targetLevel = 'gold';
        else if (currentPoints >= 100) targetLevel = 'silver';

        const { data: memTier } = await supabase
          .from('memberships')
          .select('*')
          .eq('level', targetLevel)
          .single();

        await supabase
          .from('users_membership')
          .update({
            points: currentPoints,
            membership_id: memTier ? memTier.id : undefined
          })
          .eq('user_id', userId);
      } else {
        // Just standard review points
        await supabase.from('loyalty_transactions').insert({
          user_id: userId,
          points_delta: pointsAward,
          description: 'Отзыв о посещении клуба',
          type: 'earn'
        });

        const { data: currentMem } = await supabase
          .from('users_membership')
          .select('points')
          .eq('user_id', userId)
          .single();

        const currentPoints = (currentMem?.points || 0) + pointsAward;

        let targetLevel = 'bronze';
        if (currentPoints >= 5000) targetLevel = 'diamond';
        else if (currentPoints >= 1500) targetLevel = 'black';
        else if (currentPoints >= 500) targetLevel = 'gold';
        else if (currentPoints >= 100) targetLevel = 'silver';

        const { data: memTier } = await supabase
          .from('memberships')
          .select('*')
          .eq('level', targetLevel)
          .single();

        await supabase
          .from('users_membership')
          .update({
            points: currentPoints,
            membership_id: memTier ? memTier.id : undefined
          })
          .eq('user_id', userId);
      }
    }

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

// GET /api/memberships/reviews - Fetch list of reviews
router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users (name, avatar)')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
