import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HOOKAH_SVG = `<svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Base / tray -->
  <ellipse cx="100" cy="370" rx="55" ry="12" fill="#FFBF0015" stroke="#FFBF0030" stroke-width="1"/>
  <rect x="45" y="358" width="110" height="12" rx="6" fill="#FFBF0010" stroke="#FFBF0025" stroke-width="0.8"/>
  
  <!-- Stem (column) -->
  <rect x="92" y="180" width="16" height="180" rx="8" fill="#FFBF0008" stroke="#FFBF0020" stroke-width="0.8"/>
  
  <!-- Decorative rings on stem -->
  <ellipse cx="100" cy="220" rx="12" ry="3" fill="none" stroke="#FFBF0030" stroke-width="0.6"/>
  <ellipse cx="100" cy="260" rx="12" ry="3" fill="none" stroke="#FFBF0025" stroke-width="0.6"/>
  <ellipse cx="100" cy="300" rx="12" ry="3" fill="none" stroke="#FFBF0020" stroke-width="0.6"/>
  
  <!-- Bowl (top) -->
  <path d="M70 180 Q70 145 100 135 Q130 145 130 180 Z" fill="#FFBF0012" stroke="#FFBF0028" stroke-width="1"/>
  <ellipse cx="100" cy="135" rx="30" ry="8" fill="#FFBF0010" stroke="#FFBF0035" stroke-width="0.8"/>
  
  <!-- Bowl rim -->
  <ellipse cx="100" cy="130" rx="28" ry="6" fill="none" stroke="#FFBF0040" stroke-width="1.2"/>
  
  <!-- Hose port -->
  <circle cx="130" cy="200" r="5" fill="#FFBF0010" stroke="#FFBF0030" stroke-width="0.8"/>
  
  <!-- Hose curve -->
  <path d="M135 200 Q160 195 170 210 Q180 230 165 250" fill="none" stroke="#FFBF0020" stroke-width="1.5" stroke-linecap="round"/>
  
  <!-- Mouthpiece -->
  <rect x="155" y="245" width="14" height="4" rx="2" fill="#FFBF0015" stroke="#FFBF0030" stroke-width="0.8" transform="rotate(-15 162 247)"/>
</svg>`;

interface HookahLayersProps {
  scrollMode?: boolean;
  scrollTarget?: React.RefObject<HTMLDivElement>;
  scrollOffset?: [string, string];
  className?: string;
  size?: 'hero' | 'compact';
}

function SmokeWisp({ index, total }: { index: number; total: number }) {
  const offset = (index - total / 2) * 18;
  const delay = index * 0.7;
  const duration = 3.5 + (index % 3) * 0.8;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `calc(50% + ${offset}px)`,
        bottom: '58%',
        width: '40px',
        height: '80px',
        animation: `smokeRise ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, rgba(255,191,0,0.08), rgba(255,191,0,0.02) 60%, transparent 80%)`,
          filter: 'blur(12px)',
        }}
      />
    </div>
  );
}

function GoldenParticles({ count = 6 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 2 + (i % 3),
      x: Math.cos((i / count) * Math.PI * 2) * (80 + (i % 2) * 30),
      y: Math.sin((i / count) * Math.PI * 2) * (40 + (i % 3) * 15),
      delay: i * 0.6,
      duration: 3 + (i % 3),
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
            background: `radial-gradient(circle, #FFBF0088, #FFBF0022)`,
            boxShadow: `0 0 ${p.size * 3}px #FFBF0044`,
            left: `calc(50% + ${p.x}px)`,
            top: `calc(45% + ${p.y}px)`,
            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function AuraGlow() {
  return (
    <>
      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 lg:w-96 lg:h-96 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(255,191,0,0.12), transparent 70%)',
          filter: 'blur(50px)',
          animation: 'liquidPulse 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-64 lg:h-64 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(255,213,79,0.10), transparent 60%)',
          filter: 'blur(30px)',
          animation: 'liquidShift 8s ease-in-out infinite',
        }}
      />
    </>
  );
}

export function HookahLayers({
  scrollMode = false,
  scrollTarget,
  scrollOffset = ['start center', 'end center'],
  className = '',
  size = 'hero',
}: HookahLayersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const isHero = size === 'hero';
  const svgSize = isHero ? 'w-52 h-[320px] lg:w-72 lg:h-[420px]' : 'w-36 h-[240px] lg:w-48 lg:h-[320px]';

  useEffect(() => {
    if (!scrollMode || !scrollTarget?.current || !svgRef.current) return;
    const target = scrollTarget.current;
    const el = svgRef.current;

    const st = ScrollTrigger.create({
      trigger: target,
      start: scrollOffset[0],
      end: scrollOffset[1],
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(el, {
          y: p * -20,
          scale: 1 + p * 0.03,
          opacity: 0.7 + p * 0.3,
        });
      },
    });
    return () => { st.kill(); };
  }, [scrollMode, scrollTarget, scrollOffset]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <div className="relative w-full h-full flex items-center justify-center">
        <AuraGlow />
        <GoldenParticles count={6} />

        {/* Smoke wisps */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 5 }, (_, i) => (
            <SmokeWisp key={i} index={i} total={5} />
          ))}
        </div>

        {/* Hookah silhouette */}
        <div
          ref={svgRef}
          className={`relative ${svgSize} opacity-90`}
          dangerouslySetInnerHTML={{ __html: HOOKAH_SVG }}
        />

        {/* Subtle gold rim light at base */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[22%] w-32 h-1 rounded-full opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent, #FFBF00, transparent)',
            filter: 'blur(4px)',
          }}
        />
      </div>
    </div>
  );
}
