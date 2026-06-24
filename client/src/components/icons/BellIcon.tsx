import { motion } from 'framer-motion';
import { IconProps } from './types';

interface BellIconProps extends IconProps {
  dot?: boolean;
}

export default function BellIcon({ size = 24, animated = false, className = '', dot, ...props }: BellIconProps) {
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
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      {dot && <circle cx="18" cy="6" r="2.5" fill="#FF4D4D" stroke="none" />}
    </motion.svg>
  );
}

