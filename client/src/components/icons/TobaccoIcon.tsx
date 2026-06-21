import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function TobaccoIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
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
      <path d="M12 3c-2 3-4 6-4 9a4 4 0 008 0c0-3-2-6-4-9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16c0 3 1.8 5 4 5s4-2 4-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6" strokeLinecap="round" />
      <path d="M10 9h4" strokeLinecap="round" />
    </motion.svg>
  );
}
