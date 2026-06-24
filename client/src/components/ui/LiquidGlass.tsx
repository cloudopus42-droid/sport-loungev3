import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

type GlassVariant = 'card' | 'panel' | 'nav' | 'sidebar' | 'modal';
type DepthLevel = 'flat' | 'raised' | 'deep';

const variantClasses: Record<GlassVariant, string> = {
  card: 'glass-card',
  panel: 'glass-card-premium',
  nav: 'backdrop-blur-glass bg-dark-bg/80 border-b border-[rgba(255,191,0,0.12)]',
  sidebar: 'bg-dark-surface border-r border-[rgba(255,191,0,0.12)]',
  modal: 'bg-dark-surface border border-[rgba(255,191,0,0.15)] rounded-[16px] shadow-glass',
};

const depthShadows: Record<DepthLevel, string> = {
  flat: '', raised: 'shadow-elevated', deep: 'shadow-glass',
};

interface LiquidGlassProps extends HTMLMotionProps<'div'> {
  variant?: GlassVariant;
  children: ReactNode;
  className?: string;
  animate?: boolean;
  depth?: DepthLevel;
}

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  ({ variant = 'card', children, className, animate = false, depth = 'deep', ...motionProps }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const base = clsx(
      'relative overflow-hidden',
      variantClasses[variant],
      depthShadows[depth],
      animate && !prefersReducedMotion && 'transition-all duration-700',
      className
    );

    return <motion.div ref={ref} className={base} {...motionProps}>{children}</motion.div>;
  }
);

LiquidGlass.displayName = 'LiquidGlass';
