import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlowIcon } from '@/components/ui/GlowIcon';

// Animated smoke particle
function SmokeParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: '20%',
        background: `radial-gradient(circle, rgba(255,217,102,0.15) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)`,
        filter: 'blur(8px)',
      }}
      initial={{ y: 0, opacity: 0, scale: 0.3 }}
      animate={{
        y: [-20, -180, -350],
        opacity: [0, 0.6, 0],
        scale: [0.3, 1.2, 0.5],
        x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

export function NotFound() {
  const smokeParticles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.5,
    x: 30 + Math.random() * 40,
    size: 40 + Math.random() * 80,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient smoke background */}
      <div className="absolute inset-0 pointer-events-none">
        {smokeParticles.map((p, i) => (
          <SmokeParticle key={i} {...p} />
        ))}
      </div>

      {/* Radial glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="text-center relative z-10 max-w-lg mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      >
        <motion.div
          className="bg-gradient-to-b from-[#1a1a1a]/80 to-[#0e0e0e]/90 backdrop-blur-xl border border-accent-gold/20 rounded-3xl p-10 sm:p-14 relative overflow-hidden"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Decorative corner elements */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-accent-gold/50 pointer-events-none" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-accent-gold/50 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-accent-gold/50 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-accent-gold/50 pointer-events-none" />

          {/* Hookah smoke icon */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
              <GlowIcon name="flame" color="gold" size={32} />
            </div>
          </motion.div>

          {/* 404 number */}
          <motion.h1
            className="text-7xl sm:text-8xl font-display font-bold text-accent-gold mb-3 tracking-widest"
            style={{ textShadow: '0 0 40px rgba(255,217,102,0.3)' }}
            animate={{
              textShadow: [
                '0 0 20px rgba(255,217,102,0.2)',
                '0 0 50px rgba(255,217,102,0.5)',
                '0 0 20px rgba(255,217,102,0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            404
          </motion.h1>

          {/* Main text */}
          <motion.p
            className="text-base sm:text-lg text-white/70 mb-2 font-display font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Здесь только дым...
          </motion.p>
          <motion.p
            className="text-xs sm:text-sm text-white/35 mb-8 max-w-xs mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Страница не найдена. Зато мы нашли твой идеальный микс — попробуй наш конструктор вкусов.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/mixologist">
              <GlowButton size="lg" variant="gold">
                <Flame className="w-4 h-4" /> Открыть миксолог
              </GlowButton>
            </Link>
            <Link to="/">
              <GlowButton size="lg" variant="secondary">
                На главную <ArrowRight className="w-4 h-4" />
              </GlowButton>
            </Link>
          </motion.div>

          {/* Subtle label */}
          <motion.p
            className="text-[10px] text-white/15 uppercase tracking-[0.3em] mt-8 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Sport Lounge • Premium Cyber Lounge
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
