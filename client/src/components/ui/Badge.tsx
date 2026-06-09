import clsx from 'clsx';

interface BadgeProps {
  text: string;
  color?: 'cyan' | 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md';
}

const colorStyles = {
  cyan: 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10 shadow-[0_0_8px_rgba(0,242,254,0.2)]',
  blue: 'border-accent-blue/40 text-accent-blue bg-accent-blue/10 shadow-[0_0_8px_rgba(79,172,254,0.2)]',
  purple: 'border-accent-gold/40 text-accent-gold bg-accent-gold/10 shadow-[0_0_8px_rgba(255, 191, 0,0.2)]',
  green: 'border-green-500/40 text-green-400 bg-green-500/10 shadow-[0_0_8px_rgba(34,197,94,0.2)]',
  red: 'border-red-500/40 text-red-400 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.2)]',
  yellow: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10 shadow-[0_0_8px_rgba(234,179,8,0.2)]',
  gray: 'border-white/20 text-white/60 bg-white/5',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ text, color = 'cyan', size = 'md' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border whitespace-nowrap',
        colorStyles[color],
        sizeStyles[size]
      )}
    >
      {text}
    </span>
  );
}
