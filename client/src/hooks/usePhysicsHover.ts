import { useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export function usePhysicsHover(strength = 15, rotateStrength = 10) {
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for magnetic displacement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Motion values for 3D rotation tilt
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // High-performance spring configurations for soft physics feedback
  const springConfig = { damping: 25, stiffness: 220, mass: 0.5 };
  
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    
    // Width and height of the bounding box
    const width = rect.width;
    const height = rect.height;
    
    // Relative mouse coordinates from the center of the card (-0.5 to 0.5)
    const relX = (e.clientX - rect.left) / width - 0.5;
    const relY = (e.clientY - rect.top) / height - 0.5;
    
    // Magnet offset displacement
    x.set(relX * strength);
    y.set(relY * strength);
    
    // 3D tilt rotation (moving mouse to the right tilts on Y axis, moving up tilts on X)
    rotateX.set(-relY * rotateStrength);
    rotateY.set(relX * rotateStrength);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Spring back smoothly to origin
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  return {
    hoverProps: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      style: {
        transformStyle: 'preserve-3d' as const,
      }
    },
    style: {
      x: springX,
      y: springY,
      rotateX: springRotateX,
      rotateY: springRotateY,
    },
    isHovered
  };
}
export default usePhysicsHover;

