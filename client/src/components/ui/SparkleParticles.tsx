import { useMemo } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'gold' | 'silver';
  delay: number;
  duration: number;
}

export function SparkleParticles({ count = 8 }: { count?: number }) {
  const sparkles = useMemo<Sparkle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 1.5,
      type: i % 3 === 0 ? 'silver' : 'gold',
      delay: Math.random() * 6,
      duration: 3.5 + Math.random() * 3,
    })),
    [count]
  );

  return (
    <div className="sparkle-container">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className={`sparkle ${s.type === 'gold' ? 'sparkle-gold' : 'sparkle-silver'}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
