import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function MenuIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
  const springProps = animated ? {
    whileHover: { scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    whileTap: { scale: 0.9 },
  } : {};

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={1.5}
      className={className} {...springProps} {...props}
    >
      <path d="M7 5l-4 7 4 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 5l4 7-4 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12h18" strokeLinecap="round" />
    </motion.svg>
  );
}
