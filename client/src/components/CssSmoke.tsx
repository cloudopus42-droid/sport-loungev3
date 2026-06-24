import { useMemo } from 'react';

interface SmokeParticle {
  id: number;
  x: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
  drift: number;
}

export function CssSmoke({ count = 20, className = '' }: { count?: number; className?: string }) {
  const particles = useMemo<SmokeParticle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      size: 30 + Math.random() * 60,
      opacity: 0.03 + Math.random() * 0.06,
      delay: Math.random() * 6,
      duration: 5 + Math.random() * 5,
      drift: (Math.random() - 0.5) * 60,
    })),
    [count]
  );

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '10%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(255,191,0,${p.opacity}), rgba(255,191,0,${p.opacity * 0.3}) 50%, transparent 70%)`,
            filter: 'blur(16px)',
            animation: `smokeRise ${p.duration}s ease-in-out ${p.delay}s infinite`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default CssSmoke;
