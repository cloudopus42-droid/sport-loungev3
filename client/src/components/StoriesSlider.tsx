import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Story } from '@/types';
import { StorySkeleton } from './ui/Skeleton';
import { resolveImageUrl, PREMIUM_PLACEHOLDER_SVG } from '@/lib/urls';

interface StoriesSliderProps {
  stories: Story[];
  loading?: boolean;
}

export function StoriesSlider({ stories, loading = false }: StoriesSliderProps) {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeStories = stories.filter((s) => s.isActive);

  const openStory = useCallback((index: number) => {
    setActiveStory(index);
    setProgress(0);
  }, []);

  const closeStory = useCallback(() => {
    setActiveStory(null);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const nextStory = useCallback(() => {
    if (activeStory === null) return;
    if (activeStory < activeStories.length - 1) {
      setActiveStory(activeStory + 1);
      setProgress(0);
    } else {
      closeStory();
    }
  }, [activeStory, activeStories.length, closeStory]);

  const prevStory = useCallback(() => {
    if (activeStory === null) return;
    if (activeStory > 0) {
      setActiveStory(activeStory - 1);
      setProgress(0);
    }
  }, [activeStory]);

  useEffect(() => {
    if (activeStory === null) return;

    const story = activeStories[activeStory];
    if (!story) return;

    const duration = (story.durationSeconds || 5) * 1000;
    const tick = 50;
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min((elapsed / duration) * 100, 100));

      if (elapsed >= duration) {
        nextStory();
      }
    }, tick);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeStory, activeStories, nextStory]);

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {Array.from({ length: 6 }).map((_, i) => (
          <StorySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (activeStories.length === 0) return null;

  return (
    <>
      {/* Story thumbnails */}
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide"
      >
        {activeStories.map((story, index) => (
          <motion.button
            key={story._id}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
            onClick={() => openStory(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="w-[68px] h-[68px] rounded-full p-[2.5px] bg-gradient-to-br from-yellow-300 via-accent-gold to-yellow-600 shadow-[0_0_12px_rgba(212,175,55,0.3)] animate-pulse animate-duration-[2500ms]">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-dark-bg">
                <img
                  src={resolveImageUrl(story.mediaUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PREMIUM_PLACEHOLDER_SVG;
                  }}
                />
              </div>
            </div>
            <span className="text-[10px] text-white/50 max-w-[60px] truncate">
              Лаунж
            </span>
          </motion.button>
        ))}
      </div>

      {/* Fullscreen story viewer */}
      <AnimatePresence>
        {activeStory !== null && activeStories[activeStory] && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 flex gap-1 p-2.5 z-10">
              {activeStories.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 to-accent-gold rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                    style={{
                      width:
                        i < activeStory
                          ? '100%'
                          : i === activeStory
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Close button */}
            <motion.button
              className="absolute top-8 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
              onClick={closeStory}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Navigation */}
            {activeStory > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 text-white/70 hover:text-white"
                onClick={prevStory}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {activeStory < activeStories.length - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 text-white/70 hover:text-white"
                onClick={nextStory}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Click areas for prev/next */}
            <div className="absolute inset-0 flex z-[5]">
              <div className="w-1/3 h-full" onClick={prevStory} />
              <div className="w-1/3 h-full" />
              <div className="w-1/3 h-full" onClick={nextStory} />
            </div>

            {/* Media */}
            <motion.div
              key={activeStory}
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeStories[activeStory].mediaType === 'video' ? (
                <video
                  src={resolveImageUrl(activeStories[activeStory].mediaUrl)}
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={resolveImageUrl(activeStories[activeStory].mediaUrl)}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PREMIUM_PLACEHOLDER_SVG;
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
