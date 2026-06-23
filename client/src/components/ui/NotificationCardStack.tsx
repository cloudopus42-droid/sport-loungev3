import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Star, Sparkles } from 'lucide-react';
import { useFeature } from '@/contexts/FeatureContext';
import { useNotificationQueue, type NotificationEvent } from '@/hooks/useNotificationQueue';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-2.5 h-2.5 ${i < rating ? 'text-[#FFBF00] fill-[#FFBF00]' : 'text-white/10'}`}
        />
      ))}
    </div>
  );
}

function NotificationCard({
  event,
  index,
  stackHeight,
  isActive,
}: {
  event: NotificationEvent;
  index: number;
  stackHeight: number;
  isActive: boolean;
}) {
  const { type, payload } = event;
  const name = (payload.user_name || payload.name || 'Гость') as string;
  const text = (payload.text || '') as string;
  const rating = (payload.rating || 0) as number;
  const isReview = type === 'new_review';

  return (
    <motion.div
      layout
      initial={isActive ? { opacity: 0, y: -20 } : { opacity: 0, y: -10 }}
      animate={{
        opacity: isActive ? 1 : 0.5 - index * 0.12,
        y: stackHeight,
        scale: 1 - index * 0.04,
        filter: isActive ? 'none' : 'blur(0.5px)',
      }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        type: 'spring',
        stiffness: 80,
        damping: 24,
        mass: 1,
      }}
      style={{ zIndex: 100 - index }}
      className={`
        absolute top-0 left-0 right-0
        rounded-2xl p-4 pr-5 overflow-hidden
        bg-[rgba(15,12,10,0.5)]
        backdrop-blur-[20px]
        border ${isActive ? 'border-[rgba(255,191,0,0.15)]' : 'border-[rgba(255,191,0,0.06)]'}
        shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}
      `}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0, x: '-100%' }}
          animate={{ opacity: [0, 1, 0], x: ['-100%', '0%', '100%'] }}
          transition={{ duration: 1.2, ease: 'easeInOut', times: [0, 0.5, 1] }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,191,0,0.08), transparent)',
          }}
        />
      )}
      <div className="flex items-start gap-3 relative z-10">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isReview ? 'bg-[rgba(255,191,0,0.08)]' : 'bg-[rgba(255,191,0,0.05)]'}`}>
          {isReview ? (
            <Sparkles className={`w-4 h-4 ${isActive ? 'text-[#FFBF00]' : 'text-[#B08D57]'}`} />
          ) : (
            <UserPlus className={`w-4 h-4 ${isActive ? 'text-[#FFBF00]' : 'text-[#B08D57]'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 ${!isActive ? 'opacity-60' : ''}`}>
            <span className={`text-xs font-semibold truncate ${isActive ? 'text-[#FFBF00]' : 'text-[#B08D57]'}`}>
              {isReview ? 'Новый отзыв' : 'Новый гость'}
            </span>
            {isReview && <StarRating rating={rating} />}
          </div>
          <p className={`text-sm font-medium truncate mt-0.5 ${isActive ? 'text-white' : 'text-white/70'}`}>
            {isReview ? `«${text.slice(0, 60)}${text.length > 60 ? '…' : ''}»` : name}
          </p>
          <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/40' : 'text-white/20'}`}>
            {isReview ? `от ${name}` : 'Присоединился к клубу'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const MAX_STACK_VISIBLE = 3;

export function NotificationCardStack() {
  const { isFeatureEnabled } = useFeature();
  const { current, queue } = useNotificationQueue();
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleEvents: (NotificationEvent | null)[] = [current || null];
  for (let i = 0; i < Math.min(queue.length, MAX_STACK_VISIBLE - 1); i++) {
    visibleEvents.push(queue[i]);
  }
  while (visibleEvents.length < 2) {
    visibleEvents.push(null);
  }

  if (!isFeatureEnabled('visual_notifications')) return null;
  if (!current && queue.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)]"
      style={{ perspective: '800px' }}
    >
      <div className="relative" style={{ height: `${Math.min(visibleEvents.filter(Boolean).length, MAX_STACK_VISIBLE) * 10 + 88}px` }}>
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, index) => {
            if (!event) return null;
            return (
              <NotificationCard
                key={event.id}
                event={event}
                index={index}
                stackHeight={index * 10}
                isActive={index === 0}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
