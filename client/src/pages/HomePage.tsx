import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Flame, Sparkles, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MixCarousel3D } from '@/components/MixCarousel3D';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import { CONTACT, WORKING_HOURS } from '@/config/seats';
import type { Promo } from '@/types';
import premiumHookah from '../premium_hookah.png';
import { GlowIcon } from '@/components/ui/GlowIcon';

const ThreeSmoke = lazy(() => import('@/components/ThreeSmoke').then(m => ({ default: m.ThreeSmoke })));

type ShowcaseItem = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
};

export function HomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);

  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [cardCoords, setCardCoords] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCardCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
      }
    }
  }, []);

  useEffect(() => {
    api.get<Promo[]>('/api/promos')
      .then((res) => setPromos(res.data))
      .catch(() => {});
    api.get<ShowcaseItem[]>('/api/showcases')
      .then((res) => setShowcaseItems(res.data?.filter(s => s.is_active) || []))
      .catch(() => {});
  }, []);

  const handleAddressClick = () => {
    window.open('https://yandex.ru/maps/-/CDT1Z-pC', '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="space-y-12 pb-16 overflow-x-hidden"
    >
      {/* Centered Hero Section with Neon Globe Backdrop */}
      <section className="relative overflow-hidden pt-12 pb-16 min-h-[580px] flex items-center justify-center text-center">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/кальянhhs.mp4"
        />
        {/* Dark blur gradient at bottom of video */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/70 via-black/30 to-transparent backdrop-blur-[2px] z-0" />

        <div className="relative max-w-4xl w-full mx-auto px-4 z-10 space-y-8">
          {/* Subtitle Telemetry header */}
          <motion.div 
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-ping" />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-bold">
              SPORT LOUNGE • КРУГЛОСУТОЧНО 24/7
            </span>
          </motion.div>
          
          {/* Centered Large Header */}
          <motion.h1 
            className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-white leading-[1.08] uppercase tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            ИСТИННЫЙ ВКУС <br />
            <span className="gradient-text font-black">И КРЕПОСТЬ</span>
          </motion.h1>
          
          {/* Paragraph description */}
          <motion.p 
            className="text-sm sm:text-base text-white/50 max-w-2xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Премиальный лаунж с изысканным обслуживанием, авторскими кальянами и элитными чайными церемониями. Сделайте заказ прямо за свой стол в реальном времени.
          </motion.p>
          
          {/* Action buttons (White pill & Transparent outline) */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <NavLink to="/booking" className="w-full sm:w-auto">
              <motion.button
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-white/90 text-[#080605] border-none font-bold text-sm shadow-[0_4px_24px_rgba(212,175,55,0.35)] flex items-center justify-center gap-1.5 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlowIcon name="clock" color="gold" size={16} glow={false} /> Сделать заказ
              </motion.button>
            </NavLink>
            <NavLink to="/booking" className="w-full sm:w-auto">
              <motion.button
                className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white bg-transparent text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlowIcon name="flame" color="gold" size={16} animateOnHover /> ИИ-Миксолог
              </motion.button>
            </NavLink>
          </motion.div>

          {/* Centered address cards */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-8 text-xs text-white/40 font-mono tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={handleAddressClick}>
              <GlowIcon name="mappin" color="gold" size={14} /> Г. ЧЕБОКСАРЫ, УЛ. ГАГАРИНА 40А
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <GlowIcon name="clock" color="gold" size={14} /> РАБОТАЕМ КРУГЛОСУТОЧНО 24/7
            </span>
          </motion.div>
        </div>
      </section>

      {/* Live System Console Dashboard Section - Structured Fintech Grid */}
      <section className="relative pt-4 max-w-6xl mx-auto px-4 z-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-mono text-white/50 tracking-wider">LIVE TELEMETRY FEED: SYSTEM ONLINE</span>
          </div>
          <span className="text-[10px] font-mono text-accent-gold font-bold">SPORT LOUNGE CONSOLE V3.0</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Main Visual: ThreeSmoke and breathing hookah render */}
          <div className="md:col-span-6 lg:col-span-5">
            <GlassCard className="p-6 h-full flex flex-col justify-between border border-glass-border/30 bg-[#0c0816]/90 relative overflow-hidden select-none">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-2">VOLUMETRIC VISUALIZER</span>
              <div className="relative h-48 flex items-center justify-center">
                <Suspense fallback={null}>
                  <ThreeSmoke />
                </Suspense>
                <img 
                  src={premiumHookah} 
                  alt="Sport Lounge Premium Hookah" 
                  className="max-h-[190px] w-auto object-contain filter drop-shadow-[0_12px_40px_rgba(212,175,55,0.22)] z-10 animate-breathe-image"
                />
              </div>
              <div className="text-center pt-2">
                <span className="text-[10px] text-white/50">Премиальные чаши и элитные смеси</span>
              </div>
            </GlassCard>
          </div>

          {/* System status widgets */}
          <div className="md:col-span-6 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Widget 1: Seating occupancy and wait time */}
            <GlassCard className="p-5 flex flex-col justify-between border border-glass-border/20 bg-[#0c0816]/90 select-none">
              <div>
                <span className="text-[8px] text-white/40 block uppercase tracking-wider font-semibold mb-2">Нагрузка хоста</span>
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight block">34 / 54</span>
                <span className="text-xs text-white/40 block mt-1">активных столов в зале</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/60 pt-4 border-t border-white/5">
                <GlowIcon name="clock" color="gold" size={14} className="text-accent-gold" />
                <span>Ожидание сборки заказа: ~8.5 мин</span>
              </div>
            </GlassCard>

            {/* Widget 2: Flavor Gauges */}
            <GlassCard className="p-5 flex flex-col justify-between border border-glass-border/20 bg-[#0c0816]/90 select-none">
              <div>
                <span className="text-[8px] text-white/40 block uppercase tracking-wider font-semibold mb-3">Интенсивность покура</span>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                      <span>Сладкий</span>
                      <span className="text-accent-gold font-mono font-bold">72%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent-gold to-accent-amber" style={{ width: '72%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                      <span>Крепкий</span>
                      <span className="text-accent-gold font-mono font-bold">65%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent-gold to-accent-gold" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Widget 3: Live lounge sound system */}
            <GlassCard className="p-5 sm:col-span-2 flex items-center justify-between gap-4 border border-glass-border/20 bg-[#0c0816]/90 select-none">
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                </div>
                <div className="truncate">
                  <span className="text-[8px] text-white/40 block uppercase tracking-wider font-semibold">Аудиосистема заведения</span>
                  <span className="text-xs text-white font-bold block truncate">Speed Dial — Zero 7</span>
                </div>
              </div>
              
              {/* Mini audio wave bars */}
              <div className="flex items-end gap-1 h-6 flex-shrink-0">
                <span className="w-0.5 h-3 bg-accent-gold rounded-full soundwave-bar" />
                <span className="w-0.5 h-5 bg-accent-gold rounded-full soundwave-bar" />
                <span className="w-0.5 h-4 bg-accent-gold rounded-full soundwave-bar" />
                <span className="w-0.5 h-2 bg-accent-gold rounded-full soundwave-bar" />
                <span className="w-0.5 h-5 bg-accent-gold rounded-full soundwave-bar" />
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section id="carousel" className="relative pt-8">
        <div className="text-center space-y-2 mb-6 select-none">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-semibold">
            <Flame className="w-3.5 h-3.5 inline mr-1 text-accent-gold animate-pressPop" /> НАША КОЛЛЕКЦИЯ
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider">
            Выберите <span className="gradient-text font-semibold italic">свой вкус</span>
          </h2>
        </div>

        <MixCarousel3D
          items={showcaseItems.length > 0 ? showcaseItems.map(s => ({
            id: s.id,
            title: s.title,
            subtitle: s.description,
            imageUrl: s.image_url ? resolveImageUrl(s.image_url) : undefined,
            linkUrl: s.link_url,
          })) : [
            { id: '1', title: 'Премиум табаки', subtitle: 'Отборные сорта', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
            { id: '2', title: 'Авторские миксы', subtitle: 'Шеф-миксолог рекомендует', gradient: 'linear-gradient(135deg, #2d1b69 0%, #1a1a2e 100%)' },
            { id: '3', title: 'VIP-залы', subtitle: 'Для особых гостей', gradient: 'linear-gradient(135deg, #3d1f00 0%, #1a1a2e 100%)' },
          ]}
          onItemClick={(item) => {
            if (item.linkUrl) window.open(item.linkUrl, '_blank');
            else if (item.id.length < 5) window.location.href = '/booking';
          }}
        />
      </section>

      {/* Why Guests Choose Us Section */}
      <section id="why-us" className="relative pt-8">
        <div className="text-center space-y-2 mb-10 select-none">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-semibold flex items-center justify-center gap-1">
            <GlowIcon name="flame" color="gold" size={14} /> НАШИ ПРЕИМУЩЕСТВА
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider">
            Почему гости <span className="gradient-text font-semibold italic">выбирают нас</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 relative">
          {[
            { title: 'Премиальное качество', desc: 'Только отборные табаки и качественные смеси', iconName: 'award' as const, span: 'lg:col-span-4' },
            { title: 'Идеальная крепость', desc: 'Готовим на 4 углях под баней без перегрева и горечи', iconName: 'flame' as const, span: 'lg:col-span-3' },
            { title: 'Круглосуточно 24/7', desc: 'Мы работаем для вас в любое время суток', iconName: 'clock' as const, span: 'lg:col-span-3' },
            { title: 'Комфорт и атмосфера', desc: 'Стильный интерьер и уютная атмосфера для отдыха', iconName: 'compass' as const, span: 'lg:col-span-2' },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onMouseMove={(e) => handleCardMouseMove(e)}
              onMouseEnter={() => setHoveredCardIndex(index)}
              onMouseLeave={() => setHoveredCardIndex(null)}
              className={`relative rounded-[28px] overflow-hidden group ${item.span}`}
            >
              {/* Dynamic spotlight glow that follows coordinates cursor relative */}
              {hoveredCardIndex === index && (
                <div
                  className="absolute pointer-events-none rounded-[28px] transition-opacity duration-300"
                  style={{
                    width: '320px',
                    height: '320px',
                    background: 'radial-gradient(120px circle at var(--x) var(--y), rgba(212, 175, 55, 0.15), transparent 80%)',
                    left: `${cardCoords.x - 160}px`,
                    top: `${cardCoords.y - 160}px`,
                    mixBlendMode: 'screen',
                    zIndex: 0,
                    // Injecting variables for smooth CSS calculations
                    // @ts-ignore
                    '--x': `${cardCoords.x}px`,
                    '--y': `${cardCoords.y}px`,
                  }}
                />
              )}
              
              <GlassCard className="p-6 h-full flex flex-col justify-between hover:border-accent-gold/40 border-glass-border/30 z-10 relative">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center mb-4">
                    <GlowIcon name={item.iconName} color="gold" size={18} animateOnHover />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-[11px] text-white/45 leading-relaxed font-light">{item.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Footer CTA section with VIP Club promo card */}
      <section id="events" className="relative pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch select-none">
          {/* Main Booking Panel */}
          <div className="lg:col-span-8">
            <GlassCard className="p-8 sm:p-10 h-full flex flex-col justify-between border-glass-border/30 relative overflow-hidden group min-h-[320px]">
              {/* Background Image of Cozy Lounge */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity z-0 transition-transform duration-700 group-hover:scale-105" 
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=800&auto=format&fit=crop')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/45 to-black/10 z-0" />
              {/* Soft warm lamp background effect inside CTA */}
              <div className="absolute right-0 bottom-0 w-80 h-80 bg-accent-gold/5 rounded-full blur-[90px] pointer-events-none" />
              
              <div className="space-y-4 max-w-xl z-10">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-accent-gold animate-pressPop" /> КОНСТРУКТОР ВКУСОВ
                </span>
                <h3 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider leading-none">
                  Создайте идеальный <span className="gradient-text font-semibold italic">микс</span>
                </h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
                  Смешивайте крепость, чаши, жидкую основу и до 4 вкусов в реальном времени. Сгенерируйте QR-код и покажите вашему кальянному мастеру.
                </p>
              </div>

              <div className="pt-6 z-10">
                <NavLink to="/booking">
                  <motion.button
                    className="px-8 py-3.5 rounded-full border border-[#d4af37]/40 text-white bg-gradient-to-r from-[#b8962e] to-[#8a6d1b] hover:from-[#c9a032] hover:to-[#5c1818] shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 text-sm font-semibold transition-all w-full sm:w-auto"
                    whileHover={{ scale: 1.02, transition: { type: 'spring', duration: 0.4, bounce: 0.2 } }}
                    whileTap={{ scale: 0.97, transition: { type: 'spring', duration: 0.12, bounce: 0 } }}
                  >
                    <Flame className="w-4 h-4 text-accent-gold animate-pressPop" /> Открыть конструктор
                  </motion.button>
                </NavLink>
              </div>
            </GlassCard>
          </div>

          {/* VIP Pass Panel */}
          <div className="lg:col-span-4">
            <GlassCard className="p-8 h-full flex flex-col justify-between bg-gradient-to-br from-[#0c0816]/95 via-[#050308]/98 to-black border-accent-gold/35 relative overflow-hidden text-center group min-h-[320px] z-10">
              {/* Decorative corners matching reference VIP layout */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-accent-gold/60 pointer-events-none" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-accent-gold/60 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-accent-gold/60 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-accent-gold/60 pointer-events-none" />
              
              <div className="space-y-4 z-10 mt-4">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold/90 font-bold block">Закрытый Клуб</span>
                <h4 className="text-5xl font-display font-bold text-accent-gold tracking-widest animate-glowPulse">VIP</h4>
                <p className="text-xs text-white font-medium uppercase tracking-wider mt-4">VIP-комната</p>
                <p className="text-[11px] text-white/45 font-light leading-normal">
                  для особых гостей
                </p>
              </div>

              <div className="pt-6 z-10">
                <NavLink 
                  to="/profile" 
                  className="inline-flex items-center gap-1.5 text-xs text-accent-gold hover:underline font-bold"
                >
                  <span>Подробнее</span>
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </NavLink>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Promos Banner Section */}
      {promos.length > 0 && (
        <section className="pt-8">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-gold" /> Специальные предложения
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {promos.map((promo, i) => (
              <motion.div 
                key={promo._id} 
                className="flex-shrink-0 w-[260px] sm:w-[320px] lg:w-[360px]"
                initial={{ opacity: 0, x: 30 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <GlassCard className="p-3.5 h-full hover:border-accent-gold/30 hover:shadow-glow-gold transition-all duration-300 flex flex-col justify-between">
                  <div>
                    {promo.imageUrl && (
                      <img 
                        src={resolveImageUrl(promo.imageUrl)} 
                        alt={promo.title}
                        loading="lazy"
                        className="w-full h-32 sm:h-40 object-cover rounded-xl mb-3.5" 
                      />
                    )}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-sm sm:text-base font-semibold text-white truncate">{promo.title}</h4>
                      {promo.discountPercent && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                          -{promo.discountPercent}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{promo.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Map & Detailed Contacts */}
      <section id="contacts" className="relative pt-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
          <GlowIcon name="mappin" color="gold" size={20} className="flex-shrink-0" /> Как нас найти
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard className="overflow-hidden p-0 border border-glass-border shadow-lg">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=47.2725%2C56.1366&z=17&pt=47.2725%2C56.1366%2Cpm2rdm&lang=ru_RU"
                width="100%"
                height="320"
                style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(15deg) saturate(75%) brightness(70%) contrast(110%)' }}
                allowFullScreen
                loading="lazy"
                title="Sport Lounge на карте"
              />
            </GlassCard>
          </div>

          <div className="space-y-4">
            <GlassCard className="p-5.5 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-display font-semibold text-white">Адрес и Контакты</h3>
                
                <div className="flex items-start gap-3.5">
                  <GlowIcon name="mappin" color="gold" size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-white font-medium">{CONTACT.address}</p>
                    <a 
                      href="https://yandex.ru/maps/?pt=47.2725,56.1366&z=17&l=map"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent-gold hover:underline mt-1 inline-block"
                    >
                      Открыть в Яндекс.Картах →
                    </a>
                  </div>
                </div>

                <div className="h-px bg-glass-border" />

                <div className="flex items-start gap-3.5">
                  <GlowIcon name="clock" color="gold" size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <p className="text-white font-medium">{WORKING_HOURS}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Работаем без выходных дней</p>
                  </div>
                </div>

                <div className="h-px bg-glass-border" />

                <a 
                  href={CONTACT.telegramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3.5 group"
                >
                  <GlowIcon name="send" color="gold" size={16} className="flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-accent-gold group-hover:underline font-medium">@{CONTACT.telegram}</p>
                    <p className="text-[11px] text-white/30">Написать нам в Telegram</p>
                  </div>
                </a>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

