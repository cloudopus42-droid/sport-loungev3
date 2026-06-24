import { motion } from 'framer-motion';
import clsx from 'clsx';

interface GlowIconProps {
  name: string;
  size?: number;
  color?: 'gold' | 'burgundy' | 'white';
  glow?: boolean;
  className?: string;
  animateOnHover?: boolean;
}

const colorMap: Record<string, { stroke: string; glow: string }> = {
  gold: { stroke: '#C4A46B', glow: 'rgba(196, 164, 107, 0.45)' },
  burgundy: { stroke: '#8B1A1A', glow: 'rgba(139, 26, 26, 0.45)' },
  white: { stroke: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)' },
};

const iconPaths: Record<string, string[]> = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  flame: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z'],
  calendar: ['M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  clock: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2'],
  mappin: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
  instagram: ['M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M17.5 6.5h.01'],
  chevronRight: ['M9 18l6-6-6-6'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  award: ['M7 21h10', 'M12 21V13', 'M18 4H6v4l3.5 4.5L12 10l2.5 2.5L18 8V4z'],
  compass: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z'],
  check: ['M20 6L9 17l-5-5'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  shieldCheck: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
};

export function GlowIcon({
  name,
  size = 20,
  color = 'gold',
  glow = true,
  className,
  animateOnHover = false,
}: GlowIconProps) {
  const selectedColor = colorMap[color] || colorMap.gold;
  const paths = iconPaths[name];

  if (!paths) return null;

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={selectedColor.stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx(className)}
      style={{
        filter: glow ? `drop-shadow(0 0 6px ${selectedColor.glow})` : undefined,
      }}
      whileHover={animateOnHover ? { scale: 1.2, filter: glow ? `drop-shadow(0 0 12px ${selectedColor.glow})` : undefined } : undefined}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          initial={animateOnHover ? { pathLength: 0 } : undefined}
          animate={animateOnHover ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </motion.svg>
  );
}
