import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { auth } from '../middleware/auth';
import { config } from '../config/env';
import { supabase } from '../config/supabase';
import { uploadSingle, uploadToSupabase, deleteFromSupabase } from '../middleware/upload';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // Проверяем существование пользователя
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует', status: 409 });
      return;
    }

    // Хэшируем пароль
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Создаем пользователя в БД
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: 'user'
      })
      .select()
      .single();

    if (insertError || !user) {
      res.status(500).json({ error: 'Ошибка при создании пользователя: ' + insertError?.message, status: 500 });
      return;
    }

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', data.email.toLowerCase())
      .maybeSingle();

    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль', status: 401 });
      return;
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Неверный email или пароль', status: 401 });
      return;
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google — Login/Register with Google OAuth Token
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      res.status(400).json({ error: 'Токен авторизации не предоставлен', status: 400 });
      return;
    }

    // Проверяем токен в Supabase Auth
    const { data: { user: supabaseUser }, error: verifyError } = await supabase.auth.getUser(accessToken);

    if (verifyError || !supabaseUser || !supabaseUser.email) {
      res.status(401).json({ error: 'Недействительный токен Google или сессия истекла', status: 401 });
      return;
    }

    const email = supabaseUser.email.toLowerCase();
    const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'Пользователь Google';
    const avatar = supabaseUser.user_metadata?.avatar_url || null;

    // Проверяем, существует ли пользователь в нашей таблице
    let { data: dbUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: fetchError.message });
      return;
    }

    if (!dbUser) {
      // Создаем нового пользователя со случайным паролем (вход только через Google)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 12);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          password: randomPassword,
          name,
          role: 'user',
          avatar
        })
        .select()
        .single();

      if (insertError || !newUser) {
        res.status(500).json({ error: 'Не удалось создать профиль пользователя: ' + insertError?.message });
        return;
      }
      dbUser = newUser;
    } else {
      // Обновляем аватар или имя, если они изменились и пустые в базе
      const updates: any = {};
      if (!dbUser.avatar && avatar) updates.avatar = avatar;
      if (dbUser.name === 'Пользователь Google' && name !== 'Пользователь Google') updates.name = name;
      
      if (Object.keys(updates).length > 0) {
        const { data: updated } = await supabase
          .from('users')
          .update(updates)
          .eq('id', dbUser.id)
          .select()
          .single();
        if (updated) dbUser = updated;
      }
    }

    const token = generateToken(dbUser);

    res.json({
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        avatar: dbUser.avatar,
        bio: dbUser.bio,
        phone: dbUser.phone,
        createdAt: dbUser.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .maybeSingle();

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден', status: 404 });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile — Update profile
router.put('/profile', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, bio } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'Пользователь не найден', status: 404 });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/avatar — Upload and set avatar image
router.post(
  '/avatar',
  auth,
  uploadSingle('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Файл аватара обязателен', status: 400 });
        return;
      }

      // Получаем текущего пользователя для удаления старого аватара
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('avatar')
        .eq('id', req.user!.id)
        .single();

      if (fetchError || !user) {
        res.status(404).json({ error: 'Пользователь не найден', status: 404 });
        return;
      }

      // Загружаем аватар в Supabase Storage (с локальным фоллбэком)
      let avatarUrl = '';
      let uploadedToSupabase = false;
      try {
        avatarUrl = await uploadToSupabase(req.file, 'avatars');
        uploadedToSupabase = true;
      } catch (storageError) {
        console.warn('⚠️ Supabase Storage failed, falling back to local file system:', storageError);
        const avatarsDir = path.resolve(__dirname, '../../uploads/avatars');
        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        const localPath = path.join(avatarsDir, filename);
        fs.writeFileSync(localPath, req.file.buffer);
        avatarUrl = `/uploads/avatars/${filename}`;
      }

      // Обновляем аватар в БД
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ avatar: avatarUrl })
        .eq('id', req.user!.id)
        .select()
        .single();

      if (updateError || !updatedUser) {
        res.status(500).json({ error: 'Не удалось обновить аватар пользователя', status: 500 });
        return;
      }

      // Удаляем старый аватар, если он был
      if (user.avatar) {
        if (user.avatar.startsWith('http') && uploadedToSupabase) {
          await deleteFromSupabase(user.avatar);
        } else if (user.avatar.startsWith('/uploads/avatars/')) {
          try {
            const oldLocalPath = path.resolve(__dirname, '../..', user.avatar.substring(1));
            if (fs.existsSync(oldLocalPath)) {
              fs.unlinkSync(oldLocalPath);
            }
          } catch (err) {
            console.error('Ошибка при удалении локального аватара:', err);
          }
        }
      }

      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          phone: updatedUser.phone,
          createdAt: updatedUser.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
