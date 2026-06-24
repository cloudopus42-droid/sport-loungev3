import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function HamburgerIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
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
      <path d="M3 6h18" strokeLinecap="round" />
      <path d="M3 12h18" strokeLinecap="round" />
      <path d="M3 18h18" strokeLinecap="round" />
    </motion.svg>
  );
}

