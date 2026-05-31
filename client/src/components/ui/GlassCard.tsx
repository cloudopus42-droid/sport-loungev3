import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, animate = true, onClick }: GlassCardProps) {
  const baseClasses = clsx(
    'bg-glass-bg backdrop-blur-glass border border-glass-border rounded-2xl shadow-lg',
    onClick && 'cursor-pointer',
    className
  );

  if (!animate) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
