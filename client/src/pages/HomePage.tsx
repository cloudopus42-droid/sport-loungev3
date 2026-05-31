import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MapPin, Clock, Send, Flame, Sparkles, ChevronLeft, ChevronRight, Award, Compass } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import { CONTACT, WORKING_HOURS } from '@/config/seats';
import type { Promo } from '@/types';
import premiumHookah from '../premium_hookah.png';

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
      className="space-y-12 pb-16 overflow-x-hidden"
    >
      {/* Dynamic Hero Section */}
      <section className="relative overflow-hidden pt-2 sm:pt-4 min-h-[460px] flex items-center">
        <div className="absolute inset-0 pointer-events-none z-[1]">
          {/* Subtle warm glow behind hookah */}
          <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-96 h-96 bg-accent-gold/10 rounded-full blur-[140px]" />
          <div className="absolute top-10 left-10 w-72 h-72 bg-accent-gold/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side: Typography & Description */}
          <motion.div 
            className="lg:col-span-7 space-y-6 text-left"
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent-gold animate-pulse" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-semibold">
                SPORT LOUNGE • КРУГЛОСУТОЧНО 24/7
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-light text-white leading-none uppercase tracking-wide">
              ИСТИННЫЙ <br />
              <span className="gradient-text font-semibold">ВКУС И</span> <br />
              КРЕПОСТЬ
            </h1>
            
            <p className="text-sm sm:text-base text-white/50 max-w-lg leading-relaxed font-light">
              Мы готовим кальяны на 4 углях под специальной баней. Это позволяет табаку раскрыться полностью, отдавая свой глубокий вкус и истинную крепость без перегрева и горечи.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <NavLink to="/booking" className="w-full sm:w-auto">
                <GlowButton variant="gold" size="lg" className="w-full sm:w-auto shadow-glow-gold-lg">
                  <Flame className="w-5 h-5 mr-1 text-white" /> Заказать кальян
                </GlowButton>
              </NavLink>
              <a 
                href={CONTACT.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-glass-border hover:border-accent-gold/40 hover:text-accent-gold text-white/70 transition-all text-sm font-semibold w-full sm:w-auto"
              >
                <Send className="w-4 h-4" /> Написать в Telegram
              </a>
            </div>

            {/* Bottom-left Address Cards inside Hero */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div 
                onClick={handleAddressClick}
                className="flex items-center gap-2.5 hover:text-accent-gold cursor-pointer transition-all text-xs text-white/45 bg-white/5 border border-glass-border/30 px-4 py-2 rounded-xl"
              >
                <MapPin className="w-4 h-4 text-accent-gold" />
                <span>г. Чебоксары, ул. Гагарина 40а</span>
              </div>
              
              <div 
                className="flex items-center gap-2.5 text-xs text-white/45 bg-white/5 border border-glass-border/30 px-4 py-2 rounded-xl"
              >
                <Clock className="w-4 h-4 text-accent-gold" />
                <span>Круглосуточно 24/7</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side: The Premium Hookah Image with Reflection & Glowing Shadow */}
          <motion.div 
            className="lg:col-span-5 hidden lg:flex justify-center items-center relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            {/* Soft glowing ambient circle behind image */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_60%)] filter blur-3xl pointer-events-none" />
            <img 
              src={premiumHookah} 
              alt="Sport Lounge Premium Hookah" 
              className="max-h-[520px] w-auto object-contain filter drop-shadow-[0_10px_35px_rgba(212,175,55,0.25)] animate-breathe-image"
            />
          </motion.div>
        </div>
      </section>

      {/* Grid Zone Layout matching reference image perfectly */}
      <section id="menu" className="relative pt-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-semibold">Наши зоны</span>
          <h2 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider">
            Выберите <span className="font-semibold italic">атмосферу</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {PREMIUM_ZONES.map((zone, index) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative group rounded-3xl overflow-hidden aspect-[4/5] shadow-lg border border-glass-border/30 cursor-pointer"
            >
              {/* Main Zone Image Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={zone.images[activeZoneSlide[zone.id]]}
                  alt={zone.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Black gradient mask matching reference image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/70 group-hover:via-black/25 transition-colors duration-300" />
              </div>

              {/* Card content aligned top-left matching reference design */}
              <div className="absolute top-6 left-6 right-6 z-10 flex flex-col justify-start items-start">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F4E4C4] leading-none uppercase tracking-wide group-hover:text-accent-gold transition-colors duration-300">
                  {zone.title}
                </h3>
                <p className="text-[10px] text-accent-gold/85 font-semibold mt-1 uppercase tracking-[0.2em]">
                  {zone.subtitle}
                </p>
              </div>

              {/* Card description overlay displayed on hover */}
              <div className="absolute bottom-16 left-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[11px] text-white/70 leading-relaxed font-light">
                  {zone.description}
                </p>
              </div>

              {/* Detail link bottom-left matching reference */}
              <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 text-xs text-white/50 group-hover:text-accent-gold transition-colors font-medium">
                <span>Подробнее</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Sub-slide navigation arrow toggles */}
              <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1">
                <button
                  onClick={(e) => handlePrevSlide(zone.id, e)}
                  className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-black/45 text-white/50 hover:border-accent-gold hover:text-accent-gold transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleNextSlide(zone.id, e)}
                  className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-black/45 text-white/50 hover:border-accent-gold hover:text-accent-gold transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Guests Choose Us Section */}
      <section id="why-us" className="relative pt-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-semibold">Наши преимущества</span>
          <h2 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider">
            Почему гости <span className="font-semibold italic">выбирают нас</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {[
            { title: 'Премиальное качество', desc: 'Только отборные табаки и качественные смеси', icon: Award },
            { title: 'Идеальная крепость', desc: 'Готовим на 4 углях под баней без перегрева и горечи', icon: Flame },
            { title: 'Круглосуточно 24/7', desc: 'Мы работаем для вас в любое время суток', icon: Clock },
            { title: 'Комфорт и атмосфера', desc: 'Стильный интерьер и уютная атмосфера для отдыха', icon: Compass },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <GlassCard className="p-6 h-full flex flex-col justify-between hover:border-accent-gold/30 transition-all duration-300 border-glass-border/30">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-accent-gold" />
                </div>
                <div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Booking Panel */}
          <div className="lg:col-span-8">
            <GlassCard className="p-8 sm:p-10 h-full flex flex-col justify-between bg-gradient-to-br from-white/5 to-black/45 border-glass-border/30 relative overflow-hidden group">
              {/* Soft warm lamp background effect inside CTA */}
              <div className="absolute right-0 bottom-0 w-80 h-80 bg-accent-gold/5 rounded-full blur-[90px] pointer-events-none" />
              
              <div className="space-y-4 max-w-xl">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold font-semibold">Бронирование</span>
                <h3 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider leading-none">
                  Забронируйте <span className="font-semibold italic">столик</span>
                </h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
                  Выберите удобное время и наслаждайтесь отдыхом в лучшей кальянной Чебоксар.
                </p>
              </div>

              <div className="pt-6">
                <NavLink to="/booking">
                  <GlowButton variant="gold" size="lg" className="w-full sm:w-auto">
                    Забронировать столик
                  </GlowButton>
                </NavLink>
              </div>
            </GlassCard>
          </div>

          {/* VIP Pass Panel */}
          <div className="lg:col-span-4">
            <GlassCard className="p-8 h-full flex flex-col justify-between bg-gradient-to-br from-amber-950/20 via-stone-900/40 to-black border-accent-gold/25 relative overflow-hidden text-center group">
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-gold/40 rounded-tr-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-gold/40 rounded-bl-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold font-bold">Закрытый Клуб</span>
                <h4 className="text-4xl font-display font-bold text-accent-gold tracking-widest animate-pulse">VIP</h4>
                <p className="text-xs text-white font-medium uppercase tracking-wider">VIP-комната</p>
                <p className="text-[11px] text-white/45 font-light leading-normal">
                  для особых гостей
                </p>
              </div>

              <div className="pt-6">
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
          <MapPin className="w-5 h-5 text-accent-gold" /> Как нас найти
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
