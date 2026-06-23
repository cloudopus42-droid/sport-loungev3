import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

function SmokeDot({ delay, left, size }: { delay: number; left: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-t from-[rgba(255,191,0,0.04)] to-transparent"
      style={{ width: size, height: size, left: `${left}%`, bottom: '-5%' }}
      animate={{
        y: [0, -400, -700],
        x: [0, left > 50 ? -30 : 30, left > 50 ? -60 : 60],
        opacity: [0, 0.08, 0],
        scale: [1, 1.5, 2.5],
      }}
      transition={{ duration: 8 + delay, repeat: Infinity, delay, ease: 'easeOut' }}
    />
  );
}

export function NotFound() {
  const dots = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.5,
    left: 3 + i * 8 + Math.random() * 3,
    size: 20 + (i % 5) * 12,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-dark-bg">
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-[#FFBF00] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />
      {dots.map((d, i) => <SmokeDot key={i} {...d} />)}

      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <motion.div
          className="glass-card-premium p-8 sm:p-12 max-w-md mx-auto"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <motion.h1
            className="text-7xl sm:text-8xl font-heading font-bold text-[#FFBF00] mb-2"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            404
          </motion.h1>
          <p className="text-lg font-heading text-white/60 mb-2">Здесь только дым...</p>
          <p className="text-xs text-white/30 mb-8 max-w-xs mx-auto leading-relaxed">
            Страница, которую вы ищете, не найдена. Возможно, она растворилась в дыму.
          </p>
          <Link to="/">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#B08D57] text-[#0b0807] text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,191,0,0.08)] hover:shadow-[0_0_28px_rgba(255,191,0,0.15)] transition-all duration-300 flex items-center gap-2 mx-auto">
              <Home className="w-3.5 h-3.5" />
              Вернуться на главную
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
