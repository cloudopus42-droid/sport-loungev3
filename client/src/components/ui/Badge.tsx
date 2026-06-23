import clsx from 'clsx';

interface BadgeProps {
  text: string;
  color?: 'cyan' | 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'gray' | 'gold';
  size?: 'sm' | 'md';
}

const colorStyles = {
  cyan: 'border-accent-gold/40 text-accent-gold bg-accent-gold/10',
  blue: 'border-accent-gold/40 text-accent-gold bg-accent-gold/10',
  purple: 'border-accent-gold/40 text-accent-gold bg-accent-gold/10',
  green: 'border-green-500/40 text-green-400 bg-green-500/10',
  red: 'border-red-500/40 text-red-400 bg-red-500/10',
  yellow: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  gray: 'border-white/20 text-white/60 bg-white/5',
  gold: 'border-accent-gold/40 text-accent-gold bg-accent-gold/10',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ text, color = 'gold', size = 'md' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border whitespace-nowrap',
        colorStyles[color] || colorStyles.gold,
        sizeStyles[size]
      )}
    >
      {text}
    </span>
  );
}
