import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

function SmokeDot({ delay, left, size }: { delay: number; left: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/5"
      style={{ width: size, height: size, left: `${left}%`, bottom: '-5%' }}
      animate={{
        y: [0, -300, -500],
        x: [0, left > 50 ? -20 : 20, left > 50 ? -40 : 40],
        opacity: [0, 0.12, 0],
        scale: [1, 2, 3],
      }}
      transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export function NotFound() {
  const dots = Array.from({ length: 10 }, (_, i) => ({
    delay: i * 0.6,
    left: 5 + i * 9 + Math.random() * 4,
    size: 15 + (i % 4) * 10,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#0a0a0f]">
      {dots.map((d, i) => (
        <SmokeDot key={i} {...d} />
      ))}

      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 max-w-md mx-auto"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <motion.h1
            className="text-7xl sm:text-8xl font-heading font-bold text-accent-gold mb-2"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            404
          </motion.h1>
          <p className="text-lg text-accent-gold/80 mb-2 font-heading font-medium">
            Потерялись в дыму?
          </p>
          <p className="text-sm text-white/30 mb-8">
            Запрашиваемая страница не существует или была удалена
          </p>
          <Link to="/">
            <GlowButton size="lg">
              <Home className="w-4 h-4" />
              На главную
            </GlowButton>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

