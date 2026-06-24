const easeOut = [0.23, 1, 0.32, 1];
const transition = { duration: 0.7, ease: easeOut };
const transitionFast = { duration: 0.35, ease: easeOut };
const transitionSlow = { duration: 1, ease: easeOut };

export const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: -16, transition: transitionFast },
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
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition },
  exit: { opacity: 0, scale: 0.97, transition: transitionFast },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
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
  whileHover: { y: -2, transition: { duration: 0.35, ease: easeOut } },
  whileTap: { scale: 0.98 },
};

export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
    transition: { duration: 0.35, ease: easeOut },
  },
  whileTap: { scale: 0.99 },
};

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
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
  animate: { y: 0, transition },
  exit: { y: '100%', transition: transitionFast },
};

export const reveal = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitionSlow },
};
