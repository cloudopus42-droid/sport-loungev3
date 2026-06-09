import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NavLink } from 'react-router-dom';
import api from '@/lib/api';

interface MixItem {
  id: string;
  name: string;
  description: string;
  strength: number;
  price?: number;
}

const CLASSIC_ITEMS = [
  {
    name: 'Двойное Яблоко',
    price: '1 500 ₽',
    desc: 'Нестареющая классика. Насыщенный вкус сладкого красного и кислого зеленого яблока с легкими анисовыми нотками.',
    emoji: '🍎🍏',
    image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=60&w=480&auto=format&fit=crop&fm=webp',
  },
  {
    name: 'Ледяная Мята',
    price: '1 500 ₽',
    desc: 'Чистый, супер-освежающий ментоловый профиль. Отлично бодрит рецепторы и дает морозный, густой дым.',
    emoji: '❄️🌿',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=60&w=480&auto=format&fit=crop&fm=webp',
  },
];

export function MenuPage() {
  const [mixes, setMixes] = useState<MixItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<MixItem[]>('/api/mixes')
      .then((res) => {
        setMixes(res.data || []);
      })
      .catch((err) => {
        console.error('Error fetching mixes for menu:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="space-y-16 pb-24 max-w-5xl mx-auto"
    >
      {/* Header Section */}
      <header className="text-center flex flex-col items-center select-none pt-8">
        <motion.span 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-bold flex items-center gap-1.5 mb-2.5"
        >
          <Flame className="w-4 h-4 text-accent-gold animate-pulse" /> PREMIUM MENU
        </motion.span>
        <h1 className="text-4xl sm:text-5xl font-display font-light text-white uppercase tracking-wider text-glow-amber">
          Меню Кальянов
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-2 font-light max-w-xl leading-relaxed">
          Погрузитесь в мир изысканных ароматов и густого дыма. Наша коллекция сочетает классические традиции и авторские инновации.
        </p>
      </header>

      {/* Classic Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 select-none">
          <div className="h-px bg-accent-gold/20 flex-1"></div>
          <div className="liquid-glass px-8 py-2 rounded-full border border-accent-gold/20">
            <h2 className="text-sm sm:text-base font-display font-bold text-accent-gold tracking-[0.2em] uppercase text-glow-amber">
              Classic Collection
            </h2>
          </div>
          <div className="h-px bg-accent-gold/20 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CLASSIC_ITEMS.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ y: -4 }}
              className="rounded-3xl overflow-hidden bg-glass-bg border border-glass-border/30 hover:border-accent-gold/30 flex h-40 transition-all duration-300"
            >
              <div className="w-1/3 relative overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#131313]/60" />
              </div>
              <div className="w-2/3 p-5 flex flex-col justify-center space-y-2">
                <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-1.5">
                  <h3 className="font-headline-sm text-base text-white font-bold flex items-center gap-1">
                    <span className="text-sm">{item.emoji}</span> {item.name}
                  </h3>
                  <span className="text-xs font-bold text-accent-gold">{item.price}</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-light line-clamp-3">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Signature Mixes Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 select-none">
          <div className="h-px bg-accent-gold/20 flex-1"></div>
          <div className="liquid-glass px-8 py-2 rounded-full border border-accent-gold/20">
            <h2 className="text-sm sm:text-base font-display font-bold text-accent-gold tracking-[0.2em] uppercase text-glow-amber">
              Signature Mixes
            </h2>
          </div>
          <div className="h-px bg-accent-gold/20 flex-1"></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent-gold border-t-transparent animate-spin"></div>
            <span className="text-xs text-white/40 font-light">Считывание рецептурной базы...</span>
          </div>
        ) : mixes.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
            <p className="text-xs text-white/30 font-light">Авторские бленды временно недоступны. Воспользуйтесь ИИ-Миксологом для сборки!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mixes.map((mix) => (
              <motion.div
                key={mix.id}
                whileHover={{ y: -3 }}
                className="rounded-3xl p-6 bg-glass-bg border border-glass-border/30 hover:border-accent-gold/30 flex flex-col justify-between space-y-4 transition-all duration-300"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20">
                      <Star className="w-4 h-4 text-accent-gold" />
                    </span>
                    <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/5 text-accent-gold px-2 py-0.5 rounded font-mono font-bold">
                      Крепость: {mix.strength}/10
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{mix.name}</h3>
                  <p className="text-[11px] text-white/50 leading-relaxed font-light line-clamp-3">
                    {mix.description}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-xs font-bold text-accent-gold">{mix.price || 1800} ₽</span>
                  <NavLink to="/booking">
                    <button className="px-3.5 py-1.5 rounded-full bg-accent-gold/10 hover:bg-accent-gold text-accent-gold hover:text-dark-bg text-[10px] font-bold uppercase tracking-wider border border-accent-gold/20 transition-all duration-300">
                      Заказать
                    </button>
                  </NavLink>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Info Banner */}
      <GlassCard className="p-6 border-accent-cyan/20 bg-gradient-to-r from-black/60 to-[#121c1e]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 max-w-xl">
          <span className="w-10 h-10 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
            <Info className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h4 className="text-xs uppercase tracking-wider text-accent-cyan font-bold">Кастомизация заказов</h4>
            <p className="text-[11px] text-white/50 leading-normal font-light">
              Хотите создать совершенно уникальный бленд? Откройте наш интерактивный ИИ-Конструктор, выберите до 4 вкусов, отрегулируйте процентное соотношение и колбу.
            </p>
          </div>
        </div>
        <NavLink to="/mixologist" className="w-full sm:w-auto flex-shrink-0">
          <button className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-accent-cyan hover:bg-accent-cyan/95 text-black text-[10px] font-bold uppercase tracking-widest transition-all">
            ИИ-Конструктор
          </button>
        </NavLink>
      </GlassCard>
    </motion.div>
  );
}
export default MenuPage;
