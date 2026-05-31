import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MapPin, Clock, Send, Flame, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import { CONTACT, WORKING_HOURS } from '@/config/seats';
import { showToast } from '@/components/NotificationToast';
import type { Promo } from '@/types';

// Predefined luxury zones with background images matching reference design
const PREMIUM_ZONES = [
  {
    id: 'hookah-lounge',
    title: 'Hookah Lounge',
    subtitle: 'Премиум лаунж-зона',
    images: [
      'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?q=80&w=800&auto=format&fit=crop'
    ],
    description: 'Уютные приватные VIP-комнаты с мягкими диванами и премиальным выбором табаков.',
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    subtitle: 'Ресторанная зона',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop'
    ],
    description: 'Изысканная кухня и авторские миксы, созданные нашими кальянными мастерами.',
  },
  {
    id: 'terrace',
    title: 'Terrace',
    subtitle: 'Открытая терраса',
    images: [
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515516969-d4008cc6241a?q=80&w=800&auto=format&fit=crop'
    ],
    description: 'Прекрасная открытая терраса на крыше с панорамным видом на город.',
  },
];

export function HomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [activeZoneSlide, setActiveZoneSlide] = useState<Record<string, number>>({
    'hookah-lounge': 0,
    'restaurant': 0,
    'terrace': 0,
  });

  useEffect(() => {
    api.get<Promo[]>('/api/promos')
      .then((res) => {
        setPromos(res.data);
      })
      .catch(err => {
        console.error('Error fetching homepage promos:', err);
      });
  }, []);

  const handleAddressClick = () => {
    window.open('https://yandex.ru/maps/-/CDT1Z-pC', '_blank');
  };

  const handleHoursClick = () => {
    navigator.clipboard.writeText(CONTACT.address);
    showToast('Адрес скопирован в буфер обмена!', 'success');
  };

  const handleNextSlide = (zoneId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveZoneSlide(prev => ({
      ...prev,
      [zoneId]: (prev[zoneId] + 1) % 3, // Cycle 3 mock sub-slides
    }));
  };

  const handlePrevSlide = (zoneId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveZoneSlide(prev => ({
      ...prev,
      [zoneId]: (prev[zoneId] - 1 + 3) % 3,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="space-y-8 pb-16 overflow-x-hidden"
    >
      {/* Dynamic Hero Section */}
      <section className="relative overflow-hidden pt-2 sm:pt-4 min-h-[380px] lg:min-h-[460px] flex items-center">
        {/* Cinematic loop background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.06] mix-blend-screen pointer-events-none z-0"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-smoke-in-slow-motion-41814-large.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 pointer-events-none z-[1]">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-gold/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center lg:text-left lg:flex lg:items-center lg:justify-between lg:gap-12">
          <motion.div 
            className="lg:max-w-xl space-y-4"
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold/80 font-semibold">
                SPORT LOUNGE • {WORKING_HOURS}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-white leading-tight">
              ИСТИННЫЙ <span className="gradient-text">ВКУС</span> И КРЕПОСТЬ
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-white/50 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
              Мы готовим кальяны на 4 углях под специальной баней. Это позволяет табаку раскрыться полностью, отдавая свой глубокий вкус и истинную крепость без перегрева и горечи.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
              <NavLink to="/booking">
                <GlowButton size="lg" className="w-full sm:w-auto shadow-glow-gold-lg">
                  <Flame className="w-5 h-5 mr-1 text-black" /> Оформить заказ
                </GlowButton>
              </NavLink>
              <a 
                href={CONTACT.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-glass-bg border border-glass-border hover:border-accent-gold/40 hover:text-accent-gold text-white/70 transition-all text-sm font-semibold w-full sm:w-auto"
              >
                <Send className="w-4 h-4" /> Написать в Telegram
              </a>
            </div>
          </motion.div>

          {/* Elegant Address Cards (Right side on desktop) */}
          <div className="hidden lg:flex flex-col gap-4 w-80">
            <GlassCard 
              onClick={handleAddressClick}
              className="p-4.5 flex items-center gap-3.5 hover:border-accent-gold/60 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5.5 h-5.5 text-accent-gold" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 tracking-wider uppercase font-semibold">Наш адрес</p>
                <p className="text-sm text-white font-medium">{CONTACT.address}</p>
              </div>
            </GlassCard>
            
            <GlassCard 
              onClick={handleHoursClick}
              className="p-4.5 flex items-center gap-3.5 hover:border-accent-gold/60 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5.5 h-5.5 text-accent-gold" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 tracking-wider uppercase font-semibold">Время работы</p>
                <p className="text-sm text-white font-medium">{WORKING_HOURS}</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Grid Zone Layout matching reference image perfectly */}
      <section className="relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-gold/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {PREMIUM_ZONES.map((zone, index) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative group rounded-3xl overflow-hidden aspect-[16/10] md:aspect-[1.5] shadow-lg border border-glass-border cursor-pointer"
            >
              {/* Main Zone Image Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={zone.images[activeZoneSlide[zone.id]]}
                  alt={zone.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Black gradient mask matching reference image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/70 group-hover:via-black/35 transition-colors duration-300" />
              </div>

              {/* Card content aligned top-left matching reference design */}
              <div className="absolute top-8 left-8 right-8 z-10 flex flex-col justify-start items-start pointer-events-none">
                <h3 className="text-3xl sm:text-4xl font-display font-semibold text-[#F4E4C4] leading-none uppercase tracking-wide group-hover:text-accent-gold transition-colors duration-300">
                  {zone.title}
                </h3>
                <p className="text-xs sm:text-sm text-accent-gold/85 font-light mt-1 uppercase tracking-[0.2em]">
                  {zone.subtitle}
                </p>
              </div>

              {/* Card description overlay displayed on hover */}
              <div className="absolute bottom-20 left-8 right-24 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  {zone.description}
                </p>
              </div>

              {/* Navigation arrows positioned at bottom-left matching photo */}
              <div className="absolute bottom-8 left-8 z-20 flex items-center gap-2">
                <button
                  onClick={(e) => handlePrevSlide(zone.id, e)}
                  className="w-8 h-8 rounded-full border border-accent-gold/30 flex items-center justify-center bg-black/45 text-accent-gold hover:bg-accent-gold hover:text-black transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleNextSlide(zone.id, e)}
                  className="w-8 h-8 rounded-full border border-accent-gold/30 flex items-center justify-center bg-black/45 text-accent-gold hover:bg-accent-gold hover:text-black transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          ))}

          {/* Majestic Center Floating Pill Button "Book Hookah" exactly matching image */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-30">
            <NavLink to="/booking">
              <motion.button
                className="px-10 py-4 text-base sm:text-lg font-display font-semibold text-black bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 rounded-full shadow-[0_10px_35px_rgba(212,175,55,0.5)] hover:shadow-[0_15px_45px_rgba(212,175,55,0.7)] transition-all flex items-center gap-2 border border-yellow-200/40 relative overflow-hidden group/btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Micro-sparkle effect in background */}
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <Flame className="w-5 h-5" />
                <span>Заказать кальян</span>
              </motion.button>
            </NavLink>
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
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{promo.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Map & Detailed Contacts */}
      <section className="pt-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent-gold" /> Как нас найти
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard className="overflow-hidden p-0 border border-glass-border shadow-lg">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=47.2725%2C56.1366&z=17&pt=47.2725%2C56.1366%2Cpm2rdm&lang=ru_RU"
                width="100%"
                height="320"
                style={{ border: 0, display: 'block' }}
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
                  <MapPin className="w-4.5 h-4.5 text-accent-gold mt-0.5 flex-shrink-0" />
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
                  <Clock className="w-4.5 h-4.5 text-accent-gold mt-0.5 flex-shrink-0" />
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
                  <Send className="w-4.5 h-4.5 text-accent-gold flex-shrink-0" />
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
