import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

type GlassVariant = 'card' | 'panel' | 'nav' | 'sidebar' | 'modal';

const variantClasses: Record<GlassVariant, string> = {
  card: 'liquid-glass rounded-xl',
  panel: 'liquid-glass rounded-2xl',
  nav: 'liquid-glass rounded-none border-x-0 border-t-0',
  sidebar: 'liquid-glass rounded-none border-l-0 border-t-0 border-b-0',
  modal: 'liquid-glass rounded-[20px]',
};

const intensityClasses = {
  light: 'bg-white/[0.03] backdrop-blur-[12px]',
  medium: 'bg-white/[0.05] backdrop-blur-[16px]',
  heavy: 'liquid-glass-heavy',
};

interface LiquidGlassProps extends HTMLMotionProps<'div'> {
  variant?: GlassVariant;
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  animate?: boolean;
  gold?: boolean;
}

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      variant = 'card',
      children,
      className,
      intensity = 'medium',
      animate = false,
      gold = false,
      ...motionProps
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const base = clsx(
      'relative overflow-hidden',
      variantClasses[variant],
      !variantClasses[variant]?.includes('liquid-glass-heavy') && intensityClasses[intensity],
      gold && 'liquid-glass-gold',
      animate && !prefersReducedMotion && 'liquid-glass-shimmer',
      className
    );

    return (
      <motion.div ref={ref} className={base} {...motionProps}>
        {children}
      </motion.div>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';
