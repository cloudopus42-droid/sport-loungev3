import { memo } from 'react';

/**
 * Full-screen ambient wave background with glow effects.
 * Renders across the entire viewport as a subtle atmospheric layer.
 * Pure CSS animations for performance. No content obstruction.
 */
export const WaveBackground = memo(function WaveBackground() {
  return (
    <div className="wave-bg-container" aria-hidden="true">
      {/* Ambient glow orbs */}
      <div className="wave-orb wave-orb-1" />
      <div className="wave-orb wave-orb-2" />
      <div className="wave-orb wave-orb-3" />

      {/* Full-screen SVG ambient waves */}
      <svg className="wave-svg-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveG1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.06)" />
            <stop offset="50%" stopColor="rgba(0,242,254,0.04)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.03)" />
          </linearGradient>
          <linearGradient id="waveG2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,242,254,0.05)" />
            <stop offset="50%" stopColor="rgba(212,175,55,0.04)" />
            <stop offset="100%" stopColor="rgba(0,242,254,0.02)" />
          </linearGradient>
          <linearGradient id="waveG3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.04)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0.02)" />
          </linearGradient>
        </defs>

        {/* Wave 1 — large, slow, spans full height */}
        <path
          className="wave-ambient wave-ambient-1"
          fill="url(#waveG1)"
          d="M0,300 C240,180 480,420 720,280 C960,140 1200,380 1440,250 L1440,900 L0,900 Z"
        />

        {/* Wave 2 — mid level, different phase */}
        <path
          className="wave-ambient wave-ambient-2"
          fill="url(#waveG2)"
          d="M0,500 C180,380 360,580 540,450 C720,320 900,520 1080,400 C1260,280 1380,480 1440,380 L1440,900 L0,900 Z"
        />

        {/* Wave 3 — upper area subtle flow */}
        <path
          className="wave-ambient wave-ambient-3"
          fill="url(#waveG3)"
          d="M0,150 C360,80 720,220 1080,120 C1260,70 1380,180 1440,130 L1440,0 L0,0 Z"
        />
      </svg>

      {/* Particle dots scattered across full screen */}
      <div className="wave-particles">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="wave-particle"
            style={{
              left: `${5 + Math.random() * 90}%`,
              top: `${5 + Math.random() * 90}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${1.5 + Math.random() * 2}px`,
              height: `${1.5 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
});
