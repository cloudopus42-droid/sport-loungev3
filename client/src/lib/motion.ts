const spring = { type: 'spring' as const, stiffness: 120, damping: 24, mass: 1 };
const springGentle = { type: 'spring' as const, stiffness: 80, damping: 20, mass: 1 };
const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 28, mass: 0.9 };
const springBouncy = { type: 'spring' as const, stiffness: 150, damping: 14, mass: 1 };
const springLift = { type: 'spring' as const, stiffness: 250, damping: 20, mass: 0.8 };
const transition = { duration: 0.5, ease: [0.23, 1, 0.32, 1] };
const transitionFast = { duration: 0.3, ease: [0.23, 1, 0.32, 1] };

export const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -20, transition: transitionFast },
};

export const fadeUpGentle = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -20, transition: transitionFast },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transition },
  exit: { opacity: 0, transition: transitionFast },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: 20, transition: transitionFast },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -20, transition: transitionFast },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.95, transition: transitionFast },
};

export const scaleInBouncy = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: springBouncy },
  exit: { opacity: 0, scale: 0.95, transition: transitionFast },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {},
};

export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  exit: {},
};

export const fadeUpStagger = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: spring },
};

export const scaleStagger = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: springSnappy },
};

export const hoverLift = {
  whileHover: { y: -4, transition: springLift },
  whileTap: { scale: 0.98 },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 24px rgba(212, 175, 55, 0.15), 0 0 0 1px rgba(212, 175, 55, 0.1)',
    transition: transitionFast,
  },
};

export const hoverScale = {
  whileHover: { scale: 1.04, transition: springSnappy },
  whileTap: { scale: 0.97 },
};

export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08)',
    transition: springLift,
  },
  whileTap: { scale: 0.99 },
};

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { ...spring, delay: 0.05 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
};

export const pageTransitionStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const slideUp = {
  initial: { y: '100%' },
  animate: { y: 0, transition: springGentle },
  exit: { y: '100%', transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
};

export const iconHover = {
  whileHover: { scale: 1.15, rotate: [0, -8, 8, 0], transition: { duration: 0.4 } },
  whileTap: { scale: 0.9 },
};
