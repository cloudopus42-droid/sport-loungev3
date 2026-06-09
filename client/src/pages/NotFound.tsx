import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-glass-bg backdrop-blur-glass border border-glass-border rounded-2xl p-12 max-w-md mx-auto"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <motion.h1
            className="text-8xl font-display font-bold gradient-text mb-2"
            animate={{ textShadow: ['0 0 20px rgba(0,242,254,0.3)', '0 0 40px rgba(0,242,254,0.5)', '0 0 20px rgba(0,242,254,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            404
          </motion.h1>
          <p className="text-lg text-white/60 mb-2 font-display">Страница не найдена</p>
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

