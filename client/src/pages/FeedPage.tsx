import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Heart, MessageCircle, Send, Plus, Image, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import type { Post, User } from '@/types';

interface Comment {
  id?: string;
  _id?: string;
  user: { id?: string; _id?: string; name: string; avatar?: string };
  text: string;
  createdAt: string;
}

export function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsData, setCommentsData] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const observerRef = useRef<HTMLDivElement>(null);

  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async (p: number, signal?: AbortSignal) => {
    try {
      const data = await api('/api/posts', { params: { page: p, limit: 10 }, signal });
      if (p === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(data.hasMore);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchPosts(1, ac.signal);
    return () => ac.abort();
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchPosts(next);
    }
  }, [hasMore, loading, page, fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) { showToast('Войдите чтобы лайкать', 'error'); return; }
    try {
      const data = await api(`/api/posts/${postId}/like`, { method: 'POST' });
      setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, likes: data.likes, likedBy: data.likedBy } : p));
    } catch {}
  };

  const toggleComments = async (postId: string) => {
    const newSet = new Set(expandedComments);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
      if (!commentsData[postId]) {
        try {
          const data = await api(`/api/posts/${postId}/comments`);
          setCommentsData((prev) => ({ ...prev, [postId]: data }));
        } catch {}
      }
    }
    setExpandedComments(newSet);
  };

  const submitComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      const data = await api(`/api/posts/${postId}/comments`, { method: 'POST', body: { text } });
      setCommentsData((prev) => ({ ...prev, [postId]: data }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch { showToast('Ошибка отправки', 'error'); }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage) { showToast('Добавьте фото', 'error'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', newTitle);
      fd.append('description', newDesc);
      fd.append('image', newImage);
      const data = await api('/api/posts', { method: 'POST', body: fd });
      setPosts((prev) => [data, ...prev]);
      setShowCreate(false);
      setNewTitle(''); setNewDesc(''); setNewImage(null); setNewImagePreview('');
      showToast('Пост опубликован!', 'success');
    } catch { showToast('Ошибка публикации', 'error'); }
    setCreating(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Лента сообщества</h1>
          <p className="text-xs text-white/40 mt-0.5">Фото и истории гостей Sport Lounge</p>
        </div>
        {isAuthenticated && (
          <GlowButton size="sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? 'Отмена' : 'Пост'}
          </GlowButton>
        )}
      </div>

      {/* Create Post Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard variant="premium" className="p-5">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Заголовок поста"
                  className="glass-input text-sm" required />
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Расскажите о своём визите..."
                  className="glass-input text-sm min-h-[80px] resize-none" rows={3} />
                
                {newImagePreview ? (
                  <div className="relative">
                    <img src={newImagePreview} className="w-full h-48 object-cover rounded-xl" alt="" />
                    <button type="button" onClick={() => { if (newImagePreview) URL.revokeObjectURL(newImagePreview); setNewImage(null); setNewImagePreview(''); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-dark-bg/80 text-white/60 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-glass-border hover:border-accent-gold/30 cursor-pointer transition-colors">
                    <Image className="w-5 h-5 text-white/30" />
                    <span className="text-sm text-white/30">Добавить фото</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                )}

                <GlowButton type="submit" className="w-full" loading={creating}>Опубликовать</GlowButton>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      {posts.map((post, i) => {
        const author = post.author as User;
        const liked = user ? post.likedBy?.includes(user._id) : false;
        const comments = commentsData[post._id] || [];
        const expanded = expandedComments.has(post._id);

        return (
          <motion.div key={post._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
            <GlassCard variant="premium" className="overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-gold to-accent-gold flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {author?.avatar ? (
                    <img src={resolveImageUrl(author.avatar)}
                      className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (author?.name?.[0]?.toUpperCase() || '?')}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{author?.name || 'Аноним'}</p>
                  <p className="text-[11px] text-white/30">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              {/* Image */}
              {post.imageUrl && (
                <img src={resolveImageUrl(post.imageUrl)}
                  className="w-full aspect-[4/3] object-cover" alt={post.title} loading="lazy" />
              )}

              {/* Content */}
              <div className="px-4 py-3 space-y-2">
                <h3 className="text-base font-semibold text-white">{post.title}</h3>
                {post.description && <p className="text-sm text-white/50">{post.description}</p>}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <motion.button onClick={() => handleLike(post._id)}
                    className={clsx('flex items-center gap-1.5 text-sm transition-colors', liked ? 'text-red-400' : 'text-white/40 hover:text-red-400')}
                    whileTap={{ scale: 0.9 }}>
                    <Heart className={clsx('w-5 h-5', liked && 'fill-current')} />
                    <span>{post.likes || 0}</span>
                  </motion.button>

                  <button onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-1.5 text-sm text-white/40 hover:text-accent-gold transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{(post as any).comments?.length || 0}</span>
                  </button>
                </div>

                {/* Comments */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 border-t border-glass-border">
                      {comments.map((c) => (
                        <div key={c.id || c._id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-glass-bg flex items-center justify-center text-[10px] text-white/50 flex-shrink-0 mt-0.5">
                            {c.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-white/70">{c.user?.name}</span>
                            <p className="text-xs text-white/40">{c.text}</p>
                          </div>
                        </div>
                      ))}

                      {isAuthenticated && (
                        <div className="flex gap-2 pt-1">
                          <input
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))}
                            placeholder="Комментарий..."
                            className="glass-input text-xs flex-1 !py-1.5"
                            onKeyDown={(e) => e.key === 'Enter' && submitComment(post._id)}
                          />
                          <motion.button onClick={() => submitComment(post._id)}
                            className="p-3 rounded-lg bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            whileTap={{ scale: 0.9 }}>
                            <Send className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div ref={observerRef} className="h-4" />

      {!loading && posts.length === 0 && (
        <GlassCard className="p-10 text-center">
          <MessageCircle className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <h3 className="text-lg font-display font-semibold text-white/50">Пока нет постов</h3>
          <p className="text-sm text-white/30 mt-1">Станьте первым — поделитесь фото из Sport Lounge!</p>
        </GlassCard>
      )}
    </div>
  );
}

