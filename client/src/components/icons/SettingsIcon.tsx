import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function SettingsIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
  const springProps = animated ? {
    whileHover: { scale: 1.05, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
    whileTap: { scale: 0.95 },
  } : {};

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={1.5}
      className={className} {...springProps} {...props}
    >
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 1v4" strokeLinecap="round" />
      <path d="M12 19v4" strokeLinecap="round" />
      <path d="M4.22 4.22l2.83 2.83" strokeLinecap="round" />
      <path d="M16.95 16.95l2.83 2.83" strokeLinecap="round" />
      <path d="M1 12h4" strokeLinecap="round" />
      <path d="M19 12h4" strokeLinecap="round" />
      <path d="M4.22 19.78l2.83-2.83" strokeLinecap="round" />
      <path d="M16.95 7.05l2.83-2.83" strokeLinecap="round" />
    </motion.svg>
  );
}

