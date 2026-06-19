import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Search, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type TobaccoMix = {
  id: string;
  name: string;
  brand: string;
  flavor: string;
  description: string;
  image_url: string;
  price: number;
  stock_quantity: number;
  unit: string;
  is_active: boolean;
  status: string;
};

export function TobaccoPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mixes, setMixes] = useState<TobaccoMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<TobaccoMix[]>('/api/tobacco')
      .then(res => setMixes(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = mixes.filter(m =>
    m.is_active &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.brand?.toLowerCase().includes(search.toLowerCase()) ||
     m.flavor?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 max-w-6xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold font-bold flex items-center justify-center gap-1.5">
          <Leaf className="w-4 h-4" /> ТАБАЧНОЕ МЕНЮ
        </span>
        <h1 className="text-3xl font-display font-light text-white uppercase tracking-wider">
          Наши <span className="gradient-text font-semibold italic">смеси</span>
        </h1>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию, бренду, вкусу..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border/60 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/40 focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <Leaf className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">Ничего не найдено</p>
          </div>
        ) : (
          filtered.map((mix, i) => (
            <motion.div
              key={mix.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login?redirect=/booking');
                  return;
                }
                navigate('/booking');
              }}
            >
              <GlassCard className="p-5 h-full hover:border-accent-gold/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-accent-gold" />
                  </div>
                  {mix.brand && (
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono">
                      {mix.brand}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-accent-gold transition-colors mb-1">
                  {mix.name}
                </h3>
                {mix.flavor && (
                  <p className="text-xs text-white/50 mb-1">{mix.flavor}</p>
                )}
                {mix.description && (
                  <p className="text-[11px] text-white/40 line-clamp-2 mb-3">{mix.description}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-glass-border/10">
                  <span className="text-xs font-bold text-accent-gold">
                    {mix.price} ₽
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
