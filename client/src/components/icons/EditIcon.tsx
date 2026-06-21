import { motion } from 'framer-motion';
import { IconProps } from './types';

export default function EditIcon({ size = 24, animated = false, className = '', ...props }: IconProps) {
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
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}
