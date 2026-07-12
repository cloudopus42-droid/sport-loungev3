import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

interface TabSwitcherProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onSelect: (id: T) => void;
  variant?: 'glass' | 'minimal';
  size?: 'sm' | 'md';
}

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onSelect,
  variant = 'glass',
  size = 'md',
}: TabSwitcherProps<T>) {
  return (
    <div
      className={`relative flex gap-1 p-1 overflow-x-auto scrollbar-hide ${
        variant === 'glass'
          ? 'liquid-glass bg-liquid-glass rounded-2xl'
          : 'bg-glass-bg border border-glass-border rounded-xl'
      }`}
    >
      {tabs.map(({ id, label, icon, rightSlot }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap font-bold transition-colors select-none ${
            size === 'sm' ? 'py-1.5 px-2 text-[10px]' : 'py-2.5 px-3 text-[11px]'
          } ${active === id ? 'text-[#0b0807]' : 'text-white/40 hover:text-white/70'}`}
        >
          {active === id && (
            <motion.div
              layoutId="tab-switcher-glow"
              className={`absolute inset-0 rounded-xl ${
                variant === 'glass'
                  ? 'bg-accent-gold shadow-[0_0_20px_rgba(255,191,0,0.25)]'
                  : 'bg-accent-gold/20 border border-accent-gold/40 shadow-[0_0_12px_rgba(255,191,0,0.15)]'
              }`}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5 uppercase tracking-[0.1em]">
            {icon && <span className="shrink-0">{icon}</span>}
            {label}
            {rightSlot && <span className="shrink-0">{rightSlot}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
