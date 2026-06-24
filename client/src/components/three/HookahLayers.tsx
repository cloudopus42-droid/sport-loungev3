import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const COLOR_PALETTES = [
  { inner: '#B08D57', glow: 'rgba(176,141,87,0.12)', particle: '#C4A46B', label: 'Warm Amber' },
  { inner: '#FF6B52', glow: 'rgba(255,107,82,0.10)', particle: '#FF8C7A', label: 'Coral' },
  { inner: '#4CAF50', glow: 'rgba(76,175,80,0.10)', particle: '#6ECF73', label: 'Emerald' },
  { inner: '#D4A017', glow: 'rgba(212,160,23,0.10)', particle: '#E0B840', label: 'Gold' },
  { inner: '#FF8C00', glow: 'rgba(255,140,0,0.10)', particle: '#FFA833', label: 'Amber' },
];

interface HookahLayersProps {
  bowlIndex?: number;
  liquidIndex?: number;
  scrollMode?: boolean;
  scrollTarget?: React.RefObject<HTMLDivElement>;
  scrollOffset?: [string, string];
  onBowlChange?: (index: number) => void;
  className?: string;
  size?: 'hero' | 'compact';
}

function GlassOrb({ palette, size }: { palette: typeof COLOR_PALETTES[number]; size: 'hero' | 'compact' }) {
  const isHero = size === 'hero';
  const orbSize = isHero ? 'w-56 h-56 lg:w-80 lg:h-80' : 'w-40 h-40 lg:w-56 lg:h-56';

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow aura */}
      <div
        className={`absolute ${orbSize} rounded-full opacity-60`}
        style={{
          background: `radial-gradient(circle, ${palette.glow}, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'liquidPulse 6s ease-in-out infinite',
        }}
      />

      {/* Main glass orb */}
      <div
        className={`${orbSize} rounded-full relative overflow-hidden`}
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -2px 8px rgba(0,0,0,0.04)
          `,
        }}
      >
        {/* Inner liquid gradient */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(ellipse at 35% 35%, ${palette.inner}18, ${palette.inner}08 50%, transparent 70%)`,
            animation: 'liquidShift 8s ease-in-out infinite',
          }}
        />

        {/* Specular highlight — top-left */}
        <div
          className="absolute top-[12%] left-[18%] w-[35%] h-[45%] rounded-full"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 50%, transparent)',
            filter: 'blur(8px)',
            transform: 'rotate(-15deg)',
          }}
        />

        {/* Secondary highlight — bottom-right */}
        <div
          className="absolute bottom-[15%] right-[20%] w-[20%] h-[25%] rounded-full"
          style={{
            background: 'linear-gradient(340deg, rgba(255,255,255,0.06), transparent)',
            filter: 'blur(6px)',
            transform: 'rotate(20deg)',
          }}
        />

        {/* Light sweep animation */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 55%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'lightSweep 6s ease-in-out infinite',
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 rounded-full opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
}

function FloatingParticles({ palette, count = 8 }: { palette: typeof COLOR_PALETTES[number]; count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 3 + (i % 3) * 2,
      x: Math.cos((i / count) * Math.PI * 2) * (60 + (i % 3) * 20),
      y: Math.sin((i / count) * Math.PI * 2) * (60 + (i % 3) * 20),
      delay: i * 0.8,
      duration: 4 + (i % 3) * 2,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, ${palette.particle}88, ${palette.particle}22)`,
            boxShadow: `0 0 ${p.size * 2}px ${palette.particle}44`,
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function AmbientRings() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: `${280 + i * 80}px`,
            height: `${280 + i * 80}px`,
            border: `0.5px solid rgba(255,255,255,${0.04 - i * 0.01})`,
            animation: `ringPulse ${5 + i}s ease-in-out ${i * 1.5}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export function HookahLayers({
  bowlIndex = 0,
  scrollMode = false,
  scrollTarget,
  scrollOffset = ['start center', 'end center'],
  onBowlChange,
  className = '',
  size = 'hero',
}: HookahLayersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleIndexChange = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
    onBowlChange?.(newIndex);
  }, [onBowlChange]);

  useEffect(() => {
    if (!scrollMode || !scrollTarget?.current || !containerRef.current) return;
    const target = scrollTarget.current;
    const st = ScrollTrigger.create({
      trigger: target,
      start: scrollOffset[0],
      end: scrollOffset[1],
      onUpdate: (self) => {
        const idx = Math.min(4, Math.floor(self.progress * 5));
        handleIndexChange(idx);
      },
    });
    return () => { st.kill(); };
  }, [scrollMode, scrollTarget, scrollOffset, handleIndexChange]);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, []);

  const palette = COLOR_PALETTES[bowlIndex] || COLOR_PALETTES[0];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <AmbientRings />
        <FloatingParticles palette={palette} />
        <GlassOrb palette={palette} size={size} />
      </div>
    </div>
  );
}

export { COLOR_PALETTES };
