import { Router, Request, Response, NextFunction } from 'express';
import { createPostSchema } from '../schemas/post.schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { uploadSingle, uploadToSupabase, deleteFromSupabase } from '../middleware/upload';
import { getIO } from '../socket';
import { supabase } from '../config/supabase';

const router = Router();

function mapPostToFrontend(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    imageUrl: p.image_url,
    likes: p.likes || 0,
    likedBy: p.post_likes ? p.post_likes.map((pl: any) => pl.user_id) : (p.likedBy || []),
    author: p.author ? {
      id: p.author.id || p.author_id,
      name: p.author.name,
      email: p.author.email,
      avatar: p.author.avatar,
    } : p.author_id,
    createdAt: p.created_at,
  };
}

// GET /api/posts — Public, paginated
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    // Выбираем посты, автора и лайкающих пользователей
    const { data: postsData, count, error } = await supabase
      .from('posts')
      .select('*, author:author_id(id, name, email, avatar), post_likes(user_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const mappedPosts = (postsData || []).map(mapPostToFrontend);
    const total = count || 0;

    res.json({
      posts: mappedPosts,
      total,
      page,
      limit,
      hasMore: skip + mappedPosts.length < total,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/:id — Public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, author:author_id(id, name, email, avatar), post_likes(user_id)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !post) {
      res.status(404).json({ error: 'Пост не найден', status: 404 });
      return;
    }

    res.json(mapPostToFrontend(post));
  } catch (error) {
    next(error);
  }
});

// POST /api/posts — Auth (any user can post)
router.post(
  '/',
  auth,
  uploadSingle('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createPostSchema.parse(req.body);

      if (!req.file) {
        res.status(400).json({ error: 'Изображение обязательно', status: 400 });
        return;
      }

      // Загружаем картинку в Supabase Storage
      const imageUrl = await uploadToSupabase(req.file, 'posts');

      // Создаем пост в БД
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          title: data.title,
          description: data.description || '',
          image_url: imageUrl,
          author_id: req.user!.id,
        })
        .select()
        .single();

      if (insertError || !post) {
        res.status(500).json({ error: 'Не удалось создать пост: ' + insertError?.message });
        return;
      }

      // Получаем информацию об авторе
      const { data: author } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .eq('id', req.user!.id)
        .single();

      const populatedPost = { ...post, author, post_likes: [] };
      res.status(201).json(mapPostToFrontend(populatedPost));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/posts/bulk — Auth + Admin, bulk delete
router.delete(
  '/bulk',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'Необходимо указать массив идентификаторов', status: 400 });
        return;
      }

      // Получаем картинки постов для их удаления
      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('image_url')
        .in('id', ids);

      if (posts) {
        for (const post of posts) {
          if (post.image_url) {
            await deleteFromSupabase(post.image_url);
          }
        }
      }

      // Удаляем посты из БД (лайки и комменты удалятся автоматически благодаря ON DELETE CASCADE)
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .in('id', ids);

      if (deleteError) {
        res.status(500).json({ error: deleteError.message });
        return;
      }

      try {
        const io = getIO();
        ids.forEach((id: string) => io.emit('post-deleted', { postId: id }));
      } catch (socketErr) {
        console.warn('⚠️ Socket emit post-deleted failed:', socketErr);
      }

      res.json({ message: 'Посты удалены', deletedCount: ids.length });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/posts/:id — Auth + Admin
router.delete(
  '/:id',
  auth,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('image_url')
        .eq('id', req.params.id)
        .maybeSingle();

      if (fetchError || !post) {
        res.status(404).json({ error: 'Пост не найден', status: 404 });
        return;
      }

      if (post.image_url) {
        await deleteFromSupabase(post.image_url);
      }

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', req.params.id);

      if (deleteError) {
        res.status(500).json({ error: deleteError.message });
        return;
      }

      try {
        const io = getIO();
        io.emit('post-deleted', { postId: req.params.id });
      } catch (socketErr) {
        console.warn('⚠️ Socket emit post-deleted failed:', socketErr);
      }

      res.json({ message: 'Пост удалён' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/posts/:id/like — Auth, toggle like
router.post(
  '/:id/like',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const userId = req.user!.id;

      const { data: like } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      let liked = false;
      if (like) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        liked = true;
      }

      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      const actualLikes = likesCount || 0;

      await supabase.from('posts').update({ likes: actualLikes }).eq('id', postId);

      const { data: allLikes } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', postId);

      const likedBy = (allLikes || []).map((l: any) => l.user_id);

      res.json({ likes: actualLikes, likedBy, liked });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/posts/:id/comments — Auth, add comment
router.post(
  '/:id/comments',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Текст комментария обязателен' });
        return;
      }

      const postId = req.params.id;

      // Проверяем существование поста
      const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .maybeSingle();

      if (!post) {
        res.status(404).json({ error: 'Пост не найден' });
        return;
      }

      // Вставляем коммент
      const { error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: req.user!.id,
          text: text.trim(),
        });

      if (insertError) {
        res.status(500).json({ error: insertError.message });
        return;
      }

      // Выбираем все комментарии к посту с информацией о пользователях
      const { data: comments, error: fetchCommentsError } = await supabase
        .from('post_comments')
        .select('id, text, created_at, user:user_id(id, name, avatar)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchCommentsError) {
        res.status(500).json({ error: fetchCommentsError.message });
        return;
      }

      const mappedComments = (comments || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        createdAt: c.created_at,
        user: {
          id: c.user.id,
          name: c.user.name,
          avatar: c.user.avatar,
        },
      }));

      res.status(201).json(mappedComments);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/posts/:id/comments — Public
router.get(
  '/:id/comments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;

      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('id, text, created_at, user:user_id(id, name, avatar)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      const mappedComments = (comments || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        createdAt: c.created_at,
        user: {
          id: c.user.id,
          name: c.user.name,
          avatar: c.user.avatar,
        },
      }));

      res.json(mappedComments);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
