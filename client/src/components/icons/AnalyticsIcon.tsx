import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function AnalyticsIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
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
      <path d="M18 20V10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20V4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

