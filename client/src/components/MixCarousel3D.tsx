import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  gradient?: string;
}

interface MixCarousel3DProps {
  items: CarouselItem[];
  onItemClick?: (item: CarouselItem) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const EASE = { duration: 0.5, ease: [0.23, 1, 0.32, 1] };
const DEPTH = 400;
const ROTATION_RANGE = 15;

export function MixCarousel3D({ items, onItemClick, autoPlay = true, autoPlayInterval = 5000 }: MixCarousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const goTo = useCallback((index: number) => {
    setActiveIndex(((index % items.length) + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    autoPlayRef.current = setInterval(goNext, autoPlayInterval);
    return () => clearInterval(autoPlayRef.current);
  }, [autoPlay, goNext, autoPlayInterval, items.length]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) goNext();
    else goPrev();
  }, [goNext, goPrev]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
  }, [goNext, goPrev]);

  if (!items.length) return null;

  const getItemTransform = (index: number) => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);
    const zOffset = -absOffset * (DEPTH / items.length);
    const rotateY = offset * ROTATION_RANGE;
    const scale = 1 - absOffset * 0.08;
    const xOffset = offset * 60;

    return {
      z: zOffset,
      rotateY,
      scale: Math.max(scale, 0.6),
      x: xOffset,
      opacity: absOffset === 0 ? 1 : Math.max(1 - absOffset * 0.2, 0.3),
      blur: absOffset === 0 ? 0 : Math.min(absOffset * 3, 8),
    };
  };

  const visibleItems = [];
  for (let i = 0; i < items.length; i++) {
    const offset = Math.abs(i - activeIndex);
    if (offset <= 2) visibleItems.push(i);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      className="relative w-full overflow-hidden select-none outline-none"
      style={{ perspective: '1200px', minHeight: '600px' }}
    >
      <div className="relative flex items-center justify-center w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {visibleItems.map((index) => {
          const item = items[index];
          const t = getItemTransform(index);
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={item.id}
              layout
              initial={false}
              animate={{
                x: t.x,
                y: 60,
                scale: t.scale,
                opacity: t.opacity,
                rotateY: t.rotateY,
                filter: `blur(${t.blur}px)`,
                z: t.z,
              }}
              transition={EASE}
              onClick={() => onItemClick?.(item)}
              className={`absolute cursor-pointer select-none rounded-2xl overflow-hidden border transition-shadow duration-300 ${
                isActive
                  ? 'border-accent-gold/40 shadow-glass-lg z-30'
                  : 'border-glass-border/20 shadow-lg z-20 hover:border-accent-gold/20'
              }`}
              style={{
                width: '320px',
                height: '440px',
                transformStyle: 'preserve-3d',
                background: item.gradient || '#12121a',
                backfaceVisibility: 'hidden',
              }}
            >
              {item.imageUrl && (
                <div className="absolute inset-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-6 z-10">
                <h3 className={`text-xl font-display font-bold text-white mb-1 transition-all duration-300 ${isActive ? 'text-accent-gold' : ''}`}>
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-sm text-white/60 font-light">{item.subtitle}</p>
                )}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-accent-gold">
                      Подробнее <ChevronRight className="w-3 h-3" />
                    </span>
                  </motion.div>
                )}
              </div>

              {isActive && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-accent-gold/20 border border-accent-gold/30 text-[9px] font-bold text-accent-gold uppercase tracking-wider">
                    Актуально
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full border border-white/10 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold/40 transition-all"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full border border-white/10 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold/40 transition-all"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'bg-accent-gold w-4'
                : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
