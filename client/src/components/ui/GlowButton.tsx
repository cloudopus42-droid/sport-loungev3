import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface GlowButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-accent-cyan to-accent-blue shadow-glow-cyan hover:shadow-glow-lg text-white',
  secondary: 'bg-glass-bg border border-glass-border hover:border-accent-cyan/40 hover:shadow-glow-cyan text-white',
  danger: 'bg-gradient-to-r from-red-600 to-red-500 shadow-glow-red hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] text-white',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
};

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: GlowButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={clsx(
        'relative overflow-hidden font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
