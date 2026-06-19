import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  layer: number; // 1 to 5 depth layers
  alpha: number;
  baseAlpha: number;
  speedX: number;
  speedY: number;
  angle: number;
  spinSpeed: number;
}

export function ParticleEngine() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const musicPlayingRef = useRef<boolean>(false);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const particleCount = 110;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize 5 layers of parallax dust
    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        // Distribute layer depth (1 = background, 5 = foreground)
        const layer = Math.floor(Math.random() * 5) + 1;
        const baseSize = 0.5 + (layer * 0.4) + Math.random() * 0.5; // Foreground is larger
        const baseAlpha = 0.12 + (layer * 0.08) + Math.random() * 0.15; // Foreground is brighter
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: baseSize,
          baseSize,
          layer,
          alpha: baseAlpha,
          baseAlpha,
          speedX: (Math.random() - 0.5) * (layer * 0.15 + 0.1),
          speedY: -(Math.random() * (layer * 0.18 + 0.08)), // Move upwards
          angle: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.015,
        });
      }
    };
    createParticles();

    // Mouse movement listeners
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Lounge music state event listener
    const handleMusicStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      musicPlayingRef.current = !!customEvent.detail?.isPlaying;
    };

    window.addEventListener('lounge-music-status', handleMusicStatus);

    let scrollY = window.scrollY;
    const handleScroll = () => {
      const delta = window.scrollY - scrollY;
      scrollY = window.scrollY;

      // Adjust particle Y coordinates subtly based on scroll speed and depth
      particles.forEach((p) => {
        p.y -= delta * (p.layer * 0.12);
      });
    };

    window.addEventListener('scroll', handleScroll);

    // Animation Loop
    let pulseTime = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Smooth mouse follow easing
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      pulseTime += musicPlayingRef.current ? 0.07 : 0.015;
      const musicMultiplier = musicPlayingRef.current ? 1 + Math.sin(pulseTime) * 0.25 : 1;

      particles.forEach((p) => {
        // Parallax offset based on cursor position relative to center of screen
        const screenCenterX = canvas.width / 2;
        const screenCenterY = canvas.height / 2;
        const mouseOffsetX = (mouse.x - screenCenterX) * (p.layer * 0.007);
        const mouseOffsetY = (mouse.y - screenCenterY) * (p.layer * 0.007);

        // Apply velocities and dynamic offsets
        p.x += p.speedX * (musicPlayingRef.current ? 1.8 : 1.0);
        p.y += p.speedY * (musicPlayingRef.current ? 1.8 : 1.0);
        p.angle += p.spinSpeed;

        const drawX = p.x + mouseOffsetX + Math.sin(p.angle) * (p.layer * 1.5);
        const drawY = p.y + mouseOffsetY;

        // Wrap around screen edges
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        if (p.y > canvas.height + 20) p.y = -20;

        // Visual properties (adjusting under music pulse)
        const size = p.baseSize * musicMultiplier;
        const alpha = Math.min(1.0, p.baseAlpha * (musicPlayingRef.current ? 1.5 : 1.0));

        // Draw glowing particle (gold, amber, and cyan blend)
        ctx.beginPath();
        const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, size * 2.5);
        
        let color = '212, 175, 55'; // Default gold
        if (p.layer === 4) {
          color = '255, 191, 0'; // Amber
        } else if (p.layer === 5) {
          color = '6, 182, 212'; // Cyan
        }
        
        grad.addColorStop(0, `rgba(${color}, ${alpha})`);
        grad.addColorStop(0.4, `rgba(${color}, ${alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.arc(drawX, drawY, size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('lounge-music-status', handleMusicStatus);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
export default ParticleEngine;

