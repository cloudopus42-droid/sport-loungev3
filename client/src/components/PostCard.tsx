import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import type { Post, User } from '@/types';
import api from '@/lib/api';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const author = typeof post.author === 'object' ? (post.author as User) : null;
  const formattedDate = new Date(post.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleLike = useCallback(async () => {
    setIsAnimating(true);
    setIsLiked((prev) => !prev);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      await api.post(`/api/posts/${post._id}/like`);
    } catch {
      setIsLiked((prev) => !prev);
      setLikes((prev) => (isLiked ? prev + 1 : prev - 1));
    }

    setTimeout(() => setIsAnimating(false), 600);
  }, [post._id, isLiked]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    }
  }, [post.title, post.description]);

  return (
    <motion.div
      className="bg-glass-bg backdrop-blur-glass border border-glass-border rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center flex-shrink-0">
          {author?.avatar ? (
            <img src={author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {author?.name || 'SPORT LOUNGE'}
          </p>
          <p className="text-xs text-white/40">{formattedDate}</p>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-dark-surface overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
        )}
        <img
          src={post.imageUrl}
          alt={post.title}
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Double-tap like overlay */}
        {isAnimating && !isLiked === false && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.8, times: [0, 0.1, 0.6, 1] }}
          >
            <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <motion.button
            className="flex items-center gap-1.5 group"
            onClick={handleLike}
            whileTap={{ scale: 0.85 }}
          >
            <motion.div
              animate={
                isAnimating && isLiked
                  ? { scale: [1, 1.3, 0.9, 1.1, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.5 }}
            >
              <Heart
                className={clsx(
                  'w-6 h-6 transition-colors duration-300',
                  isLiked
                    ? 'text-red-500 fill-red-500'
                    : 'text-white/60 group-hover:text-red-400'
                )}
              />
            </motion.div>
            <span
              className={clsx(
                'text-sm font-medium transition-colors',
                isLiked ? 'text-red-400' : 'text-white/60'
              )}
            >
              {likes}
            </span>
          </motion.button>

          <motion.button
            className="flex items-center gap-1.5 text-white/60 hover:text-accent-cyan transition-colors"
            onClick={handleShare}
            whileTap={{ scale: 0.85 }}
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Title & Description */}
        {post.title && (
          <h3 className="text-sm font-semibold text-white">{post.title}</h3>
        )}
        {post.description && (
          <p className="text-sm text-white/60 leading-relaxed line-clamp-3">
            {post.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
