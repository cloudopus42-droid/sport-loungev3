const springGentle = { type: 'spring' as const, stiffness: 80, damping: 24, mass: 1 };
const transition = { duration: 0.6, ease: [0.23, 1, 0.32, 1] };
const transitionFast = { duration: 0.3, ease: [0.23, 1, 0.32, 1] };

export const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: -20, transition: transitionFast },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition },
  exit: { opacity: 0, transition: transitionFast },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition },
  exit: { opacity: 0, x: 20, transition: transitionFast },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition },
  exit: { opacity: 0, x: -20, transition: transitionFast },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition },
  exit: { opacity: 0, scale: 0.98, transition: transitionFast },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: {},
};

export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
  exit: {},
};

export const fadeUpStagger = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition },
};

export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
  whileTap: { scale: 0.98 },
};

export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
  whileTap: { scale: 0.99 },
};

export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { ...transition, delay: 0.05 } },
  exit: { opacity: 0, y: -8, transition: transitionFast },
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
  exit: { y: '100%', transition: transitionFast },
};
