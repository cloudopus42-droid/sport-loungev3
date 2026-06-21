import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

type GlassVariant = 'card' | 'panel' | 'nav' | 'sidebar' | 'modal' | 'premium' | 'gold-ring';
type DepthLevel = 'flat' | 'raised' | 'deep' | 'xl';

const variantClasses: Record<GlassVariant, string> = {
  card: 'liquid-glass rounded-xl',
  panel: 'liquid-glass rounded-2xl',
  nav: 'liquid-glass rounded-none border-x-0 border-t-0',
  sidebar: 'liquid-glass rounded-none border-l-0 border-t-0 border-b-0',
  modal: 'liquid-glass rounded-[20px]',
  premium: 'glass-card-premium',
  'gold-ring': 'glass-card-gold-ring',
};

const intensityClasses: Record<string, string> = {
  light: 'bg-white/[0.03] backdrop-blur-[12px]',
  medium: 'bg-white/[0.05] backdrop-blur-[16px]',
  heavy: 'liquid-glass-heavy',
};

const depthShadows: Record<DepthLevel, string> = {
  flat: '',
  raised: 'shadow-elevated',
  deep: 'shadow-glass-lg',
  xl: 'shadow-glass-premium',
};

interface LiquidGlassProps extends HTMLMotionProps<'div'> {
  variant?: GlassVariant;
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  animate?: boolean;
  gold?: boolean;
  depth?: DepthLevel;
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
      depth = 'deep',
      ...motionProps
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const base = clsx(
      'relative overflow-hidden',
      variantClasses[variant],
      !variantClasses[variant]?.includes('liquid-glass-heavy') && !variant.startsWith('glass-card') && intensityClasses[intensity],
      gold && !variantClasses[variant]?.includes('liquid-glass-gold') && !variant.startsWith('glass-card') && 'liquid-glass-gold',
      animate && !prefersReducedMotion && 'liquid-glass-shimmer',
      depthShadows[depth],
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
