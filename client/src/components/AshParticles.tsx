import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  life: number;
  maxLife: number;
}

export function AshParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createParticle = (): Particle => {
      const size = Math.random() * 3 + 1;
      const maxLife = Math.random() * 600 + 400;
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        size,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -(Math.random() * 0.6 + 0.15),
        opacity: Math.random() * 0.35 + 0.05,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.015 + 0.005,
        wobbleAmp: Math.random() * 1.5 + 0.5,
        life: 0,
        maxLife,
      };
    };

    // Seed initial particles spread across screen
    for (let i = 0; i < 35; i++) {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.current.push(p);
    }

    const drawParticle = (p: Particle) => {
      const lifeRatio = p.life / p.maxLife;
      // Fade in at start, fade out at end
      const fade = lifeRatio < 0.1
        ? lifeRatio / 0.1
        : lifeRatio > 0.85
          ? (1 - lifeRatio) / 0.15
          : 1;
      const alpha = p.opacity * fade;
      if (alpha <= 0) return;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      // Ash particle — soft irregular shape
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      gradient.addColorStop(0, 'rgba(180, 170, 155, 0.9)');
      gradient.addColorStop(0.4, 'rgba(160, 150, 135, 0.5)');
      gradient.addColorStop(1, 'rgba(140, 130, 115, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Slightly irregular circle
      const segments = 6;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wobbleOffset = Math.sin(angle * 3 + p.wobble) * p.size * 0.2;
        const r = p.size + wobbleOffset;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particles.current.length < 45 && Math.random() < 0.12) {
        particles.current.push(createParticle());
      }

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];

        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * p.wobbleAmp * 0.1;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.life++;

        drawParticle(p);

        // Remove dead or off-screen particles
        if (p.life >= p.maxLife || p.y < -50 || p.x < -50 || p.x > canvas.width + 50) {
          particles.current.splice(i, 1);
        }
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
