import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function LuxuryCursor() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [hidden, setHidden] = useState(true);

  // Motion values for precise cursor coordinate tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Spring physics configs for liquid gold inertia lag
  const springConfigInner = { damping: 45, stiffness: 600, mass: 0.1 };
  const springConfigOuter = { damping: 30, stiffness: 220, mass: 0.6 };

  const innerX = useSpring(cursorX, springConfigInner);
  const innerY = useSpring(cursorY, springConfigInner);
  const outerX = useSpring(cursorX, springConfigOuter);
  const outerY = useSpring(cursorY, springConfigOuter);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (hidden) setHidden(false);
    };

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    // Dynamic hover listeners for links, buttons, inputs, select
    const addHoverListeners = () => {
      const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [data-hover]');
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', () => setHovered(true));
        el.addEventListener('mouseleave', () => setHovered(false));
      });
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Initial hook
    addHoverListeners();

    // DOM MutationObserver to dynamically hook cursors to elements loaded later
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      observer.disconnect();
    };
  }, [cursorX, cursorY, hidden]);

  if (hidden) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden lg:block">
      {/* 1. Outer Liquid Purple/Fuchsia Ring */}
      <motion.div
        className="fixed w-9 h-9 border border-accent-gold/45 rounded-full pointer-events-none"
        style={{
          x: outerX,
          y: outerY,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: hovered 
            ? '0 0 16px rgba(168, 85, 247, 0.45), inset 0 0 8px rgba(217, 70, 239, 0.25)' 
            : '0 0 6px rgba(168, 85, 247, 0.1)',
          borderColor: hovered ? 'rgba(217, 70, 239, 0.85)' : 'rgba(168, 85, 247, 0.45)',
        }}
        animate={{
          scale: clicked ? 0.75 : hovered ? 1.5 : 1,
          backgroundColor: clicked 
            ? 'rgba(168, 85, 247, 0.15)' 
            : hovered 
            ? 'rgba(217, 70, 239, 0.05)' 
            : 'rgba(0, 0, 0, 0)',
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
      />

      {/* 2. Glowing Fuchsia Core */}
      <motion.div
        className="fixed w-2 h-2 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full pointer-events-none"
        style={{
          x: innerX,
          y: innerY,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: '0 0 8px rgba(217, 70, 239, 0.8)',
        }}
        animate={{
          scale: clicked ? 1.3 : hovered ? 0.5 : 1,
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
      />
    </div>
  );
}
export default LuxuryCursor;
