import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { fadeUp } from '@/lib/motion';

type CardVariant = 'default' | 'premium' | 'gold-ring';

const variantClasses: Record<CardVariant, string> = {
  default: 'glass-card bg-liquid-glass',
  premium: 'glass-card-premium bg-liquid-glass',
  'gold-ring': 'glass-card-gold-ring bg-liquid-glass',
};

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
  variant?: CardVariant;
  hoverable?: boolean;
}

export function GlassCard({
  children, className, animate = true, onClick, variant = 'default', hoverable = false,
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const baseClasses = clsx(variantClasses[variant], onClick && 'cursor-pointer', className);

  if (!animate || prefersReducedMotion) {
    return <div className={baseClasses} onClick={onClick}>{children}</div>;
  }

  const props = onClick ? { onClick } : {};

  const hoverMotion = hoverable ? {
    whileHover: { y: -4, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
    whileTap: { scale: 0.99 },
  } : {};

  return (
    <motion.div className={baseClasses} {...fadeUp} {...hoverMotion} {...props}>
      {children}
    </motion.div>
  );
}
