import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function CartIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
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
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18" strokeLinecap="round" />
      <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" />
    </motion.svg>
  );
}
