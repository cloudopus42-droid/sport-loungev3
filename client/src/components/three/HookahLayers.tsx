import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BOWL_COLORS = [
  { primary: '#C4956A', secondary: '#A67B5B', accent: '#8B6241', label: 'Cosmo Bowl', desc: 'Классическая глина' },
  { primary: '#FF6B52', secondary: '#E85A42', accent: '#CC4A35', label: 'Грейпфрут', desc: 'Цитрусовая свежесть' },
  { primary: '#4CAF50', secondary: '#3D8B40', accent: '#2E6B30', label: 'Кактус', desc: 'Экзотическая подача' },
  { primary: '#D4A017', secondary: '#B88C14', accent: '#9C7810', label: 'Ананас', desc: 'Тропический вкус' },
  { primary: '#FF8C00', secondary: '#E07B00', accent: '#C46A00', label: 'Апельсин', desc: 'Сочная классика' },
];

const LIQUID_COLORS = ['#87CEEB', '#8B0000', '#3C1414', '#FFA500', '#B0E0E6'];

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

function BowlLayer({ config, visible }: { config: typeof BOWL_COLORS[number]; visible: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, zIndex: visible ? 10 : 0 }}
    >
      <div className="relative">
        {/* Bowl body */}
        <div
          className="w-32 h-32 lg:w-48 lg:h-48 rounded-full relative"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, ${config.primary}, ${config.secondary} 60%, ${config.accent})`,
            boxShadow: `0 0 40px ${config.primary}22, inset 0 -8px 24px ${config.accent}88`,
          }}
        >
          {/* Bowl rim */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-[90%] h-4 rounded-t-full"
            style={{
              background: `linear-gradient(180deg, ${config.primary}cc, ${config.secondary})`,
              border: `1px solid ${config.accent}66`,
            }}
          />
          {/* Bowl reflection */}
          <div
            className="absolute top-4 left-6 w-8 h-12 rounded-full opacity-30"
            style={{
              background: `linear-gradient(180deg, white, transparent)`,
              filter: 'blur(6px)',
              transform: 'rotate(-15deg)',
            }}
          />
        </div>
        {/* Bowl shadow */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-3 rounded-full opacity-40"
          style={{
            background: `radial-gradient(ellipse, ${config.accent}88, transparent)`,
            filter: 'blur(4px)',
          }}
        />
      </div>
    </div>
  );
}

function SmokeLayer({ active }: { active: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700"
      style={{ opacity: active ? 0.6 : 0, zIndex: active ? 15 : 0 }}
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${20 + i * 6}px`,
            height: `${20 + i * 6}px`,
            background: `radial-gradient(circle, rgba(255,255,255,${0.08 - i * 0.008}), transparent)`,
            filter: `blur(${8 + i * 2}px)`,
            transform: `translate(${(i - 4) * 12}px, ${-20 - i * 8}px)`,
          }}
        />
      ))}
    </div>
  );
}

function ParticleLayer({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-500"
      style={{ opacity: active ? 1 : 0, zIndex: active ? 20 : 0 }}
    >
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 40 + Math.random() * 30;
        return (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 4px ${color}`,
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              top: `calc(50% + ${Math.sin(angle) * radius}px)`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

function ShaftLayer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
      <div className="relative flex flex-col items-center">
        {/* Stem */}
        <div className="w-1.5 h-28 lg:h-40 bg-gradient-to-b from-[#2A2A2A] via-[#3A3A3A] to-[#2A2A2A] rounded-sm border border-white/5" />
        {/* Tray */}
        <div className="w-20 h-3 lg:w-28 lg:h-4 -mt-1 rounded-sm bg-gradient-to-b from-[#1A1A1A] to-[#252525] border border-white/8" />
      </div>
    </div>
  );
}

function FlaskLayer({ liquidColor }: { liquidColor: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
      <div className="relative">
        {/* Glass body */}
        <div
          className="w-28 h-28 lg:w-40 lg:h-40 rounded-full relative overflow-hidden"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06), transparent 60%)`,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Liquid fill */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[60%] rounded-b-full transition-colors duration-700"
            style={{
              background: `linear-gradient(180deg, ${liquidColor}44, ${liquidColor}88)`,
            }}
          />
          {/* Glass highlight */}
          <div
            className="absolute top-3 left-4 w-6 h-10 rounded-full opacity-15"
            style={{
              background: 'linear-gradient(180deg, white, transparent)',
              filter: 'blur(4px)',
              transform: 'rotate(-20deg)',
            }}
          />
        </div>
        {/* Base ring */}
        <div className="w-32 lg:w-44 h-4 -mt-2 mx-auto rounded-b-full bg-gradient-to-b from-[#1A1A1A] to-[#111111] border-t border-white/5" />
      </div>
    </div>
  );
}

function BaseLayer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
      <div className="relative flex flex-col items-center mt-20 lg:mt-28">
        {/* Base plate */}
        <div className="w-28 h-6 lg:w-36 lg:h-8 rounded-full bg-gradient-to-b from-[#1A1A1A] to-[#111111] border border-white/8" />
        {/* Gold ring */}
        <div className="w-24 h-1.5 lg:w-32 -mt-0.5 rounded-full bg-gradient-to-r from-[#B08D57] via-[#C4A46B] to-[#B08D57] opacity-60" />
        <div className="w-20 h-3 lg:w-28 -mt-0.5 rounded-b-full bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] border border-white/5" />
      </div>
    </div>
  );
}

export function HookahLayers({
  bowlIndex = 0,
  liquidIndex = 0,
  scrollMode = false,
  scrollTarget,
  scrollOffset = ['start center', 'end center'],
  onBowlChange,
  className = '',
  size = 'hero',
}: HookahLayersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swapActive, setSwapActive] = useState(false);
  const swapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleBowlChange = useCallback((newIndex: number) => {
    setSwapActive(true);
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    swapTimerRef.current = setTimeout(() => setSwapActive(false), 800);
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
        handleBowlChange(idx);
      },
    });
    return () => { st.kill(); };
  }, [scrollMode, scrollTarget, scrollOffset, handleBowlChange]);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, []);

  const bowlConfig = BOWL_COLORS[bowlIndex] || BOWL_COLORS[0];
  const liquidColor = LIQUID_COLORS[liquidIndex] || LIQUID_COLORS[0];
  const isHero = size === 'hero';

  return (
    <div
      ref={containerRef}
      className={`relative ${isHero ? 'w-full h-full' : 'w-full h-full'} ${className}`}
    >
      <div className="relative w-full h-full">
        <BaseLayer />
        <FlaskLayer liquidColor={liquidColor} />
        <ShaftLayer />
        <BowlLayer config={bowlConfig} visible={!swapActive} />
        <SmokeLayer active={swapActive} />
        <ParticleLayer active={swapActive} color={bowlConfig.primary} />
      </div>
    </div>
  );
}

export { BOWL_COLORS, LIQUID_COLORS };
