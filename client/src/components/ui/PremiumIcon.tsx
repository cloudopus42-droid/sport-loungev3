import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumIconProps {
  name: string;
  size?: number;
  className?: string;
  interactive?: boolean;
}

type IconConfig = {
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
  rects?: { x: number; y: number; w: number; h: number; rx?: number }[];
  viewBox?: string;
};

const ICONS: Record<string, IconConfig> = {
  // ── FLAVORS ──
  apple: {
    paths: [
      'M12 3c-1.5 0-3 .5-4 2-1.5 2-1 5 .5 7 1 1.3 2.5 2.5 3.5 2.5s2.5-1.2 3.5-2.5c1.5-2 2-5 .5-7-1-1.5-2.5-2-4-2z',
      'M12 3c0-1.5 1.5-2.5 3-2',
      'M10 8c1.5-.5 3 0 4 1',
    ],
    circles: [{ cx: 12, cy: 12, r: 10 }],
  },
  mango: {
    paths: [
      'M12 4c-3 0-6 2-7 6-1 4 1 7 4 8 1.5.5 2.5.3 3-.5.5-1 .5-2.5 0-4-.5-1.5-1-3-1-3s1.5 1 2.5 1c2 0 3.5-2 3.5-4.5S15 4 12 4z',
    ],
  },
  peach: {
    paths: [
      'M12 5c-2.5 0-5 1.5-6 4.5-1 3 0 6 2.5 7.5 1.2.7 2.3.7 3.5 0 2.5-1.5 3.5-4.5 2.5-7.5C13 6.5 12 5 12 5z',
      'M12 5c0-2 1-3 2.5-3.5',
    ],
  },
  citrus: {
    paths: [
      'M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z',
      'M12 4v16',
      'M4 12h16',
      'M6.3 6.3l11.4 11.4',
      'M17.7 6.3L6.3 17.7',
    ],
  },
  strawberry: {
    paths: [
      'M12 4c-3.5 0-6 2-7 5-1 3 0 6.5 3 8 1 .5 2.2.8 3.5.8h1c1.3 0 2.5-.3 3.5-.8 3-1.5 4-5 3-8-1-3-3.5-5-7-5z',
      'M9 4c-.5-1.5 0-3 1-3.5',
      'M15 4c.5-1.5 0-3-1-3.5',
      'M8 8h.01',
      'M12 8h.01',
      'M16 8h.01',
      'M10 11h.01',
      'M14 11h.01',
    ],
  },
  berry: {
    paths: [
      'M8 14c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z',
      'M10 10c-1.5-1-2-3-1.5-4.5',
      'M14 10c1.5-1 2-3 1.5-4.5',
      'M12 6c0-2 1-3.5 2-4',
    ],
    circles: [
      { cx: 10, cy: 14, r: 1 },
      { cx: 13, cy: 13, r: 1 },
      { cx: 14, cy: 16, r: 1 },
      { cx: 11, cy: 17, r: 1 },
    ],
  },
  watermelon: {
    paths: [
      'M12 4c-4.4 0-8 3.6-8 8 0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-4.4-3.6-8-8-8z',
      'M4 12h16',
      'M8 9l.01',
      'M12 8l.01',
      'M16 9l.01',
      'M10 11l.01',
      'M14 11l.01',
    ],
  },
  banana: {
    paths: [
      'M4 18c1-4 4-8 8-10 2-.5 4 0 5 1 1 1 1 3 0 5-2 4-6 6-9 5-1.5-.5-3-1-4-1z',
    ],
  },
  coconut: {
    paths: [
      'M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z',
      'M8 8c1 1 2 1.5 4 1.5s3-.5 4-1.5',
      'M9 12h.01',
      'M15 12h.01',
    ],
  },
  lemon: {
    paths: [
      'M12 4c-3 0-5.5 1.5-7 4-1.5 2.5-1.5 5.5 0 8 1.5 2.5 4 4 7 4s5.5-1.5 7-4c1.5-2.5 1.5-5.5 0-8-1.5-2.5-4-4-7-4z',
      'M12 4c1.5 1 2.5 3 2.5 5s-1 4-2.5 5',
    ],
  },
  ice: {
    paths: [
      'M12 2L4 7v10l8 5 8-5V7l-8-5z',
      'M12 2v20',
      'M4 7l8 5 8-5',
      'M4 17l8-5 8 5',
    ],
  },
  cactus: {
    paths: [
      'M12 22V8',
      'M12 8c-2-3-5-4-5-4s0 3 1 5',
      'M12 12c2-3 5-4 5-4s0 3-1 5',
      'M8 22h8',
      'M10 2c.5-.5 1-.8 1.5-1',
    ],
  },
  grape: {
    paths: [
      'M12 4c-2 0-3.5 1-4 3-.5 2 0 4 1.5 5.5.8.8 1.5 1.5 2.5 1.5s1.7-.7 2.5-1.5c1.5-1.5 2-3.5 1.5-5.5-.5-2-2-3-4-3z',
    ],
    circles: [
      { cx: 10, cy: 14, r: 2 },
      { cx: 14, cy: 14, r: 2 },
      { cx: 12, cy: 17, r: 2 },
      { cx: 11, cy: 20, r: 1.5 },
      { cx: 13, cy: 20, r: 1.5 },
    ],
  },
  fire: {
    paths: [
      'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z',
    ],
  },
  diamond: {
    paths: [
      'M6 3h12l4 6-10 13L2 9z',
      'M2 9h20',
      'M12 22L6 3',
      'M12 22l6-19',
    ],
  },
  star: {
    paths: [
      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    ],
  },
  dove: {
    paths: [
      'M12 4c-2 0-4 1-5 3-1 2-.5 4 1 5.5.8.8 1.5 1.2 2.5 1.2.5 0 1-.1 1.5-.3',
      'M12 4c1-2 3-3 5-3',
      'M8 8c-2 1-3 3-3 5',
      'M5 14l3-2 3 2',
      'M18 12c1 1 1 3 0 4',
    ],
  },
  scale: {
    paths: [
      'M12 3v18',
      'M8 7l4-4 4 4',
      'M4 7l2 6h0a3 3 0 0 0 6 0h0l2-6',
      'M14 7l2 6h0a3 3 0 0 0 6 0h0l2-6',
    ],
  },
  muscle: {
    paths: [
      'M6 12c0-2 1-4 3-5 1-.5 2-.5 3 0 1-.5 2-.5 3 0 2 1 3 3 3 5',
      'M4 14c-1 0-2 1-2 2v2h4v-2c0-1-1-2-2-2z',
      'M20 14c1 0 2 1 2 2v2h-4v-2c0-1 1-2 2-2z',
      'M10 10c.5-.5 1-.8 2-1',
    ],
  },
  // ── MOODS ──
  honey: {
    paths: [
      'M12 2c-3 0-5 2-5 5 0 3 2 5 2 7v2h6v-2c0-2 2-4 2-7 0-3-2-5-5-5z',
      'M9 18h6',
      'M10 21h4',
      'M12 2v-0',
    ],
  },
  leaf: {
    paths: [
      'M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1 3.5-4.5 6-9 10z',
      'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
    ],
  },
  palm: {
    paths: [
      'M12 22V10',
      'M12 10c-3-5-7-6-9-5 2 3 5 5 9 5z',
      'M12 10c3-5 7-6 9-5-2 3-5 5-9 5z',
      'M12 14c-4-3-7-2-8 0 3 1 6 0 8-0z',
      'M12 14c4-3 7-2 8 0-3 1-6 0-8 0z',
    ],
  },
  trophy: {
    paths: [
      'M6 9V2h12v7',
      'M6 2h12v4a6 6 0 0 1-12 0V2z',
      'M6 5H2v2a3 3 0 0 0 6 0V5z',
      'M18 5h4v2a3 3 0 0 1-6 0V5z',
      'M12 14v4',
      'M8 22h8',
      'M8 18h8',
    ],
  },
  // ── ADVANTAGES ──
  awardPremium: {
    paths: [
      'M7 21h10',
      'M12 21V13',
      'M18 4H6v4l3.5 4.5L12 10l2.5 2.5L18 8V4z',
    ],
    circles: [{ cx: 12, cy: 8, r: 2 }],
  },
  compassPremium: {
    paths: [
      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
      'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
    ],
  },
  clockPremium: {
    paths: [
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
      'M12 6v6l4 2',
    ],
  },
  flamePremium: {
    paths: [
      'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z',
    ],
  },
  // ── NAVIGATION ──
  homeNav: {
    paths: [
      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M9 22V12h6v10',
    ],
  },
  orderNav: {
    paths: [
      'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
      'M16 2v4',
      'M8 2v4',
      'M3 10h18',
      'M8 14h.01',
      'M12 14h.01',
      'M16 14h.01',
      'M8 18h.01',
      'M12 18h.01',
    ],
  },
  profileNav: {
    paths: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    ],
  },
  tobaccoNav: {
    paths: [
      'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z',
      'M12 6v12',
      'M8 8c2 0 3 1 4 4s2 4 4 4',
    ],
  },
  // ── STATUS ──
  smoke: {
    paths: [
      'M4 14c1-2 3-3 5-3s4 1 5 3',
      'M2 10c2-3 5-4 8-4s6 1 8 4',
      'M6 18c1-1 2-2 4-2s3 1 4 2',
    ],
  },
  gaming: {
    paths: [
      'M6 11h4',
      'M8 9v4',
      'M15 12h.01',
      'M18 10h.01',
      'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1.368 0 2.642-.47 3.664-1.248l2.676 1.572A4 4 0 0 0 14.68 18h.64a4 4 0 0 0 3.978-3.59c.006-.052.01-.101.017-.152C21.396 12.584 22 7.544 22 6a3 3 0 0 0-3-3c-1.368 0-2.642.47-3.664 1.248L13.66 2.676A4 4 0 0 0 11.32 5z',
    ],
  },
  crown: {
    paths: [
      'M2 20h20',
      'M4 16l2-12 6 5 6-5 2 12H4z',
      'M4 16h16v2H4z',
    ],
    circles: [
      { cx: 5, cy: 4, r: 1 },
      { cx: 12, cy: 3, r: 1 },
      { cx: 19, cy: 4, r: 1 },
    ],
  },
  bolt: {
    paths: [
      'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
    ],
  },
  shield: {
    paths: [
      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    ],
  },
  chat: {
    paths: [
      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    ],
  },
  sparkle: {
    paths: [
      'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z',
    ],
  },
  heart: {
    paths: [
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    ],
  },
  sendPremium: {
    paths: [
      'M22 2L11 13',
      'M22 2l-7 20-4-9-9-4 20-7z',
    ],
  },
  bell: {
    paths: [
      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
      'M13.73 21a2 2 0 0 1-3.46 0',
    ],
  },
  search: {
    paths: [
      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
      'M21 21l-4.35-4.35',
    ],
  },
  lock: {
    paths: [
      'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z',
      'M7 11V7a5 5 0 0 1 10 0v4',
    ],
  },
  mail: {
    paths: [
      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
      'M22 6l-10 7L2 6',
    ],
  },
  phone: {
    paths: [
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    ],
  },
  calendar: {
    paths: [
      'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
      'M16 2v4',
      'M8 2v4',
      'M3 10h18',
    ],
  },
  user: {
    paths: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    ],
  },
  cart: {
    paths: [
      'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z',
      'M3 6h18',
      'M16 10a4 4 0 0 1-8 0',
    ],
  },
  checkCircle: {
    paths: [
      'M22 11.08V12a10 10 0 1 1-5.93-9.14',
      'M22 4L12 14.01l-3-3',
    ],
  },
  xCircle: {
    paths: [
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
      'M15 9l-6 6',
      'M9 9l6 6',
    ],
  },
  info: {
    paths: [
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
      'M12 16v-4',
      'M12 8h.01',
    ],
  },
  trash: {
    paths: [
      'M3 6h18',
      'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    ],
  },
  edit: {
    paths: [
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
      'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    ],
  },
  plus: {
    paths: [
      'M12 5v14',
      'M5 12h14',
    ],
  },
  minus: {
    paths: [
      'M5 12h14',
    ],
  },
  eye: {
    paths: [
      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    ],
  },
  menu: {
    paths: [
      'M3 12h18',
      'M3 6h18',
      'M3 18h18',
    ],
  },
  close: {
    paths: [
      'M18 6L6 18',
      'M6 6l12 12',
    ],
  },
  chevronLeft: {
    paths: ['M15 18l-6-6 6-6'],
  },
  chevronRight: {
    paths: ['M9 18l6-6-6-6'],
  },
  chevronUp: {
    paths: ['M18 15l-6-6-6 6'],
  },
  chevronDown: {
    paths: ['M6 9l6 6 6-6'],
  },
  loader: {
    paths: ['M12 2v4', 'M12 18v4', 'M4.93 4.93l2.83 2.83', 'M16.24 16.24l2.83 2.83', 'M2 12h4', 'M18 12h4', 'M4.93 19.07l2.83-2.83', 'M16.24 7.76l2.83-2.83'],
  },
  warning: {
    paths: [
      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      'M12 9v4',
      'M12 17h.01',
    ],
  },
  mappin: {
    paths: [
      'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
      'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    ],
  },
  logOut: {
    paths: [
      'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
      'M16 17l5-5-5-5',
      'M21 12H9',
    ],
  },
};

// Premium gold gradient definition
const GoldGradient = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFD54F" />
      <stop offset="50%" stopColor="#FFBF00" />
      <stop offset="100%" stopColor="#B08D57" />
    </linearGradient>
    <filter id={`${id}-glow`}>
      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export function PremiumIcon({
  name,
  size = 24,
  className = '',
  interactive = true,
}: PremiumIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const icon = ICONS[name];
  const gradientId = `premium-${name}-${Math.random().toString(36).slice(2, 6)}`;

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  if (!icon) return null;

  const viewBox = icon.viewBox || '0 0 24 24';

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      className={`premium-icon ${className}`}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      initial={false}
      animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      style={{ overflow: 'visible' }}
    >
      <GoldGradient id={gradientId} />

      {/* Glow background on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.circle
            cx="12"
            cy="12"
            r="14"
            fill={`url(#${gradientId})`}
            opacity={0}
            initial={{ opacity: 0, r: 10 }}
            animate={{ opacity: 0.08, r: 14 }}
            exit={{ opacity: 0, r: 10 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Main paths with draw-on animation */}
      {icon.paths.map((d, i) => (
        <motion.path
          key={`p-${i}`}
          d={d}
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={isHovered ? `url(#${gradientId}-glow)` : undefined}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: 1,
            ...(isHovered ? { strokeWidth: 1.8 } : { strokeWidth: 1.5 }),
          }}
          transition={{
            pathLength: {
              duration: 0.8,
              delay: i * 0.08,
              ease: 'easeInOut',
            },
            opacity: { duration: 0.3, delay: i * 0.05 },
            strokeWidth: { duration: 0.2 },
          }}
        />
      ))}

      {/* Circles (berries, dots) */}
      {icon.circles?.map((c, i) => (
        <motion.circle
          key={`c-${i}`}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={`url(#${gradientId})`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isHovered ? 1.2 : 1,
            opacity: isHovered ? 1 : 0.8,
          }}
          transition={{
            duration: 0.3,
            delay: 0.3 + i * 0.05,
            ease: [0.23, 1, 0.32, 1],
          }}
        />
      ))}

      {/* Rects */}
      {icon.rects?.map((r, i) => (
        <motion.rect
          key={`r-${i}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={r.rx}
          fill={`url(#${gradientId})`}
          initial={{ scale: 0 }}
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        />
      ))}
    </motion.svg>
  );
}
