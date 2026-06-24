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
  primary: 'bg-gold-DEFAULT text-black font-bold shadow-[0_4px_20px_rgba(176,141,87,0.25),0_0_40px_rgba(176,141,87,0.1)] hover:bg-gold-light hover:shadow-[0_4px_28px_rgba(176,141,87,0.35),0_0_50px_rgba(176,141,87,0.15)]',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
  gold: 'bg-gold-DEFAULT text-black font-bold shadow-[0_4px_20px_rgba(176,141,87,0.25),0_0_40px_rgba(176,141,87,0.1)] hover:bg-gold-light hover:shadow-[0_4px_28px_rgba(176,141,87,0.35),0_0_50px_rgba(176,141,87,0.15)]',
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
        'relative overflow-hidden font-semibold inline-flex items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={isDisabled ? {} : { scale: 1.02, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } }}
      whileTap={isDisabled ? {} : { scale: 0.98, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
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
