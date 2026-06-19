import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface GlowButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-accent-gold to-yellow-500 text-black font-bold shadow-glow-gold border border-yellow-200/20 hover:shadow-glow-gold-lg',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
  gold: 'bg-gradient-to-r from-accent-gold to-yellow-500 text-black font-bold shadow-glow-gold border border-yellow-200/20 hover:shadow-glow-gold-lg',
  danger: 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.4)] border border-white/20 text-white',
};

const sizeStyles = {
  sm: 'px-4 py-1.5 text-xs rounded',
  md: 'px-6 py-2.5 text-sm rounded',
  lg: 'px-8 py-3 text-base rounded',
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
