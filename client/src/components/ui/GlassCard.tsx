import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { fadeUp, hoverLift } from '@/lib/motion';

type CardVariant = 'default' | 'premium' | 'gold-ring';

const variantClasses: Record<CardVariant, string> = {
  default: 'glass-card',
  premium: 'glass-card-premium',
  'gold-ring': 'glass-card-gold-ring',
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
  children,
  className,
  animate = true,
  onClick,
  variant = 'default',
  hoverable = false,
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const baseClasses = clsx(
    variantClasses[variant],
    onClick && 'cursor-pointer',
    className
  );

  if (!animate || prefersReducedMotion) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {children}
      </div>
    );
  }

  const props = onClick ? { onClick } : {};

  if (hoverable) {
    return (
      <motion.div
        className={baseClasses}
        {...fadeUp}
        {...hoverLift}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={baseClasses}
      {...fadeUp}
      {...props}
    >
      {children}
    </motion.div>
  );
}
