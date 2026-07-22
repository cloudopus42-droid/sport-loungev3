import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-gold-DEFAULT text-black font-bold shadow-[0_4px_20px_rgba(255,191,0,0.25),0_0_40px_rgba(255,191,0,0.1)] hover:bg-gold-light hover:shadow-[0_4px_28px_rgba(255,191,0,0.35),0_0_50px_rgba(255,191,0,0.15)]',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
  gold: 'bg-gold-DEFAULT text-black font-bold shadow-[0_4px_20px_rgba(255,191,0,0.25),0_0_40px_rgba(255,191,0,0.1)] hover:bg-gold-light hover:shadow-[0_4px_28px_rgba(255,191,0,0.35),0_0_50px_rgba(255,191,0,0.15)]',
  danger: 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.4)] border border-white/20 text-white',
};

const sizeStyles = {
  sm: 'px-4 py-1.5 text-xs rounded',
  md: 'px-6 py-2.5 text-sm rounded',
  lg: 'px-8 py-3 text-base rounded',
};

export const GlowButton = memo(function GlowButton({
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
    <button
      className={clsx(
        'relative overflow-hidden font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {children}
    </button>
  );
});
