import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function ShowcaseIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
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
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 21h8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17v4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}
