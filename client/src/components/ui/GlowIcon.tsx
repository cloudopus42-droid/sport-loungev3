import { motion } from 'framer-motion';
import clsx from 'clsx';

interface GlowIconProps {
  name: 
    | 'home'
    | 'flame'
    | 'calendar'
    | 'user'
    | 'clock'
    | 'mappin'
    | 'send'
    | 'instagram'
    | 'chevronRight'
    | 'chevronLeft'
    | 'award'
    | 'compass'
    | 'check'
    | 'x'
    | 'shieldCheck';
  size?: number;
  color?: 'purple' | 'cyan' | 'magenta' | 'white';
  glow?: boolean;
  className?: string;
  animateOnHover?: boolean;
}

const colorMap = {
  purple: {
    stroke: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  cyan: {
    stroke: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.45)',
  },
  magenta: {
    stroke: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.45)',
  },
  white: {
    stroke: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.3)',
  },
};

export function GlowIcon({
  name,
  size = 20,
  color = 'purple',
  glow = true,
  className,
  animateOnHover = false,
}: GlowIconProps) {
  const selectedColor = colorMap[color] || colorMap.purple;

  // Custom paths for smooth self-drawing animations
  const iconPaths: Record<string, string[]> = {
    home: [
      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M9 22V12h6v10',
    ],
    flame: [
      'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z',
    ],
    calendar: [
      'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
      'M16 2v4',
      'M8 2v4',
      'M3 10h18',
    ],
    user: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    ],
    clock: [
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
      'M12 6v6l4 2',
    ],
    mappin: [
      'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
      'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    ],
    send: [
      'M22 2L11 13',
      'M22 2l-7 20-4-9-9-4 20-7z',
    ],
    instagram: [
      'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z',
      'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z',
      'M17.5 6.5h.01',
    ],
    chevronRight: ['M9 18l6-6-6-6'],
    chevronLeft: ['M15 18l-6-6 6-6'],
    award: [
      'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
      'M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    ],
    compass: [
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
      'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
    ],
    check: ['M20 6L9 17l-5-5'],
    x: ['M18 6L6 18', 'M6 6l12 12'],
    shieldCheck: [
      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      'M9 11l2 2 4-4',
    ],
  };

  const paths = iconPaths[name] || [];
  const filterId = `glow-${color}-${name}`;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={selectedColor.stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx('relative inline-block overflow-visible', className)}
      whileHover={animateOnHover ? { scale: 1.15 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <defs>
        {glow && (
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComponentTransfer in="blur" result="glowAlpha">
              <feFuncA type="linear" slope="0.8" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glowAlpha" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {paths.map((d, index) => (
        <motion.path
          key={index}
          d={d}
          filter={glow ? `url(#${filterId})` : undefined}
          initial={{ pathLength: 0, opacity: 0.1 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 0.95, ease: 'easeOut', delay: index * 0.12 },
            opacity: { duration: 0.3, delay: index * 0.12 },
          }}
        />
      ))}
    </motion.svg>
  );
}

export default GlowIcon;
