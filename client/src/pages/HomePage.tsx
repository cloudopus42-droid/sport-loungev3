import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Flame, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import { CONTACT, WORKING_HOURS } from '@/config/seats';
import type { Promo } from '@/types';
import { GlowIcon } from '@/components/ui/GlowIcon';


interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}


// Predefined luxury zones with background images matching reference design
const PREMIUM_ZONES = [
  {
    id: 'hookah-lounge',
    title: 'Hookah Lounge',
    subtitle: 'Премиум лаунж-зона',
    images: [
      'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=60&w=480&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=60&w=480&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?q=60&w=480&auto=format&fit=crop&fm=webp'
    ],
    description: 'Уютные приватные VIP-комнаты с мягкими диванами и премиальным выбором табаков.',
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    subtitle: 'Ресторанная зона',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=60&w=480&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=60&w=480&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=60&w=480&auto=format&fit=crop&fm=webp'
    ],
    description: 'Изысканная кухня и авторские миксы, созданные нашими кальянными мастерами.',
  },
  {
    id: 'terrace',
    title: 'Terrace',
    subtitle: 'Открытая терраса',
    images: [
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=60&w=480&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=60&w=480&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1515516969-d4008cc6241a?q=60&w=480&auto=format&fit=crop&fm=webp'
    ],
    description: 'Прекрасная открытая терраса на крыше с панорамным видом на город.',
  },
];

export function HomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [activeZoneSlide, setActiveZoneSlide] = useState<Record<string, number>>({
    'hookah-lounge': 0,
    'restaurant': 0,
    'terrace': 0,
  });

  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [cardCoords, setCardCoords] = useState({ x: 0, y: 0 });
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCardCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    api.get<Promo[]>('/api/promos')
      .then((res) => {
        setPromos(res.data);
      })
      .catch(err => {
        console.error('Error fetching homepage promos:', err);
      });

    api.get<ShowcaseItem[]>('/api/showcases')
      .then((res) => {
        setShowcases(res.data);
      })
      .catch(err => {
        console.error('Error fetching homepage showcases:', err);
      });
  }, []);

  const MAP_SERVICES = [
    { id: 'yandex', name: 'Яндекс Карты', icon: '🗺️', url: 'https://yandex.ru/maps/?text=Чебоксары+ул+Гагарина+40а&z=17' },
    { id: 'google', name: 'Google Maps', icon: '📍', url: 'https://www.google.com/maps/search/?api=1&query=56.1365,47.2734' },
    { id: '2gis', name: '2ГИС', icon: '🏙️', url: 'https://2gis.ru/cheboksary/search/ул.+Гагарина+40а' },
    { id: 'apple', name: 'Apple Maps', icon: '🍎', url: 'https://maps.apple.com/?q=56.1365,47.2734&z=17' },
  ];

  const openMap = (serviceId: string) => {
    const svc = MAP_SERVICES.find(s => s.id === serviceId);
    if (svc) window.open(svc.url, '_blank');
  };

  const handleAddressClick = () => {
    const saved = localStorage.getItem('preferred_map_service');
    if (saved && MAP_SERVICES.find(s => s.id === saved)) {
      openMap(saved);
    } else {
      setShowMapPicker(true);
    }
  };

  const handleMapServiceSelect = (serviceId: string) => {
    localStorage.setItem('preferred_map_service', serviceId);
    setShowMapPicker(false);
    openMap(serviceId);
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
      {/* Centered Hero Section with Elegant Radial Glow */}
      <section className="relative overflow-hidden pt-16 pb-20 min-h-[620px] flex items-center justify-center text-center">
        {/* Background handled by ShaderBackground */}

        <div className="relative max-w-4xl w-full mx-auto px-4 z-10 space-y-10">
          {/* Status pill */}
          <motion.div 
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-accent-gold/20 bg-accent-gold/[0.06] backdrop-blur-sm mx-auto glow-box"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse shadow-[0_0_8px_rgba(255,191,0,0.6)]" />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold/80 font-semibold">
              Премиальный Кибер-Лаунж
            </span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1 
            className="text-5xl sm:text-7xl md:text-8xl font-display font-bold text-accent-gold leading-[1.02] tracking-[-0.02em] glow-text drop-shadow-[0_0_20px_rgba(255,191,0,0.4)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Искусство Дыма<br />
            <span className="gradient-text">&amp; Вкуса</span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Погрузитесь в атмосферу исключительного отдыха. Эксклюзивные табачные бленды, авторская миксология и безупречный сервис в эстетике современного кибер-минимализма.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <NavLink to="/booking" className="w-full sm:w-auto">
              <motion.button
                className="w-full sm:w-auto px-10 py-4 rounded-cyber bg-accent-gold text-[#131313] font-bold text-sm uppercase tracking-widest glow-box hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-glow-amber-lg"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Заказать сейчас
              </motion.button>
            </NavLink>
            <NavLink to="/mixologist" className="w-full sm:w-auto">
              <motion.button
                className="w-full sm:w-auto px-10 py-4 rounded-cyber liquid-glass text-accent-gold font-bold text-sm uppercase tracking-widest hover:bg-accent-gold/10 hover:glow-box transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Flame className="w-4 h-4" /> Смотреть Меню
              </motion.button>
            </NavLink>
          </motion.div>

          {/* Address line */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4 text-[11px] text-white/25 font-medium tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="flex items-center gap-1.5 cursor-pointer hover:text-white/50 transition-colors duration-300" onClick={handleAddressClick}>
              <GlowIcon name="mappin" color="gold" size={12} /> Чебоксары, ул. Гагарина 40а
            </span>
            <span className="hidden sm:inline text-white/10">|</span>
            <span className="flex items-center gap-1.5">
              <GlowIcon name="clock" color="gold" size={12} /> Круглосуточно 24/7
            </span>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 z-10 relative overflow-hidden select-none">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
          {/* Image Side */}
          <div className="md:col-span-5 relative group animate-float">
            <div className="absolute -inset-4 border border-accent-gold/40 rounded-cyber translate-x-4 translate-y-4 -z-10 transition-transform duration-500 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:border-accent-gold glow-box"></div>
            <img 
              alt="Signature Cocktail" 
              className="rounded-cyber shadow-[0_0_40px_rgba(255,191,0,0.15)] object-cover w-full h-[450px] filter contrast-125 brightness-90 grayscale-[10%]" 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=60&w=480&auto=format&fit=crop&fm=webp"
            />
            {/* Glassmorphism badge */}
            <div className="absolute -bottom-6 -right-6 liquid-glass p-4 rounded-cyber shadow-lg glow-box border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-accent-gold text-lg glow-text animate-pulse">🍹</span>
                <div>
                  <div className="font-display font-bold text-accent-gold text-xs leading-tight glow-text">Авторская</div>
                  <div className="text-[10px] text-accent-gold uppercase tracking-[0.1em] font-semibold">Миксология</div>
                </div>
              </div>
            </div>
          </div>
          {/* Text Side */}
          <div className="md:col-span-6 md:col-start-7 flex flex-col justify-center space-y-5">
            <div className="flex items-center gap-3 opacity-90">
              <div className="h-[2px] w-8 bg-accent-gold glow-box"></div>
              <span className="text-xs uppercase tracking-widest text-accent-gold font-bold glow-text">О нас</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-light text-white leading-tight uppercase tracking-wider">
              Святилище <br/> <span className="gradient-text font-semibold italic">Спокойствия</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
              SPORT LOUNGE — это не просто лаунж, это закрытое пространство для истинных ценителей. Мы создали уникальный клуб, где время замедляет свой ход, уступая место глубоким разговорам, сенсорным открытиям и абсолютному расслаблению.
            </p>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
              Каждая деталь нашего интерьера, от гладких темных поверхностей до пульсирующего янтарного света, продумана для создания идеального баланса между киберпанком и чувственным удовольствием.
            </p>
            <div>
              <NavLink to="/booking" className="text-accent-gold text-xs uppercase tracking-widest hover:glow-text transition-all duration-300 flex items-center gap-1.5 group font-bold">
                Подробнее о концепции
                <span className="transition-transform group-hover:translate-x-1.5">→</span>
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section (Витрина кальянов) */}
      {showcases.length > 0 && (
        <section id="showcase" className="relative pt-4 max-w-6xl mx-auto px-4 z-10">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-6 select-none">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-accent-gold/80 shadow-[0_0_8px_rgba(255,191,0,0.5)]" />
              <span className="text-[10px] font-medium text-white/35 tracking-wider uppercase">Эксклюзивная витрина</span>
            </div>
            <span className="text-[10px] font-medium text-white/20 tracking-wider">Premium Selection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcases.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative rounded-[28px] overflow-hidden group border border-glass-border/30 bg-[#1c1b1b]/60 backdrop-blur-md flex flex-col justify-between hover:border-accent-gold/40 transition-colors"
              >
                <div>
                  {item.imageUrl && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-[28px]">
                      <img
                        src={resolveImageUrl(item.imageUrl)}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-display font-bold text-white group-hover:text-accent-gold transition-colors">{item.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-light">{item.description}</p>
                  </div>
                </div>
                
                <div className="p-6 pt-0 mt-auto flex justify-between items-center border-t border-white/5">
                  <span className="text-[10px] text-accent-gold uppercase tracking-wider font-semibold">Premium Object</span>
                  <NavLink to="/booking">
                    <button className="px-4 py-1.5 rounded-full bg-accent-gold/10 hover:bg-accent-gold text-accent-gold hover:text-dark-bg text-[10px] font-bold uppercase tracking-wider border border-accent-gold/30 hover:border-accent-gold transition-all duration-300">
                      Заказать покур
                    </button>
                  </NavLink>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Menu Preview Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 z-10 relative overflow-hidden select-none">
        <div className="liquid-glass border border-white/10 p-8 rounded-cyber flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h2 className="text-3xl font-display font-light text-white uppercase tracking-wider">
              Авторские <span className="gradient-text font-semibold italic">Миксы</span>
            </h2>
            <p className="text-xs text-white/50 mt-1 font-light">Тщательно отобранные композиции для искушенных гостей</p>
          </div>
          <NavLink to="/menu">
            <button className="liquid-glass border border-white/10 text-accent-gold text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-cyber hover:glow-box hover:bg-accent-gold/10 transition-all duration-300">
              Полное Меню
            </button>
          </NavLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu Card 1 */}
          <div className="liquid-glass border border-white/10 p-6 hover:glow-box transition-all duration-500 rounded-cyber flex flex-col justify-between space-y-6 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 border-b border-accent-gold/20 pb-3">
              <h3 className="font-display font-bold text-sm text-white group-hover:text-accent-gold transition-colors">Обсидиановый Закат</h3>
              <span className="text-[9px] font-bold text-black bg-accent-gold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,191,0,0.5)]">Крепкий</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-light flex-grow">Глубокие ноты темного бельгийского шоколада, терпкой дикой вишни и легкий, едва уловимый оттенок копченого дуба. Плотный, насыщенный дым.</p>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Premium Line</span>
              <div className="text-xs font-bold text-accent-gold tracking-widest glow-text">2 800 ₽</div>
            </div>
          </div>
          {/* Menu Card 2 */}
          <div className="liquid-glass border border-white/10 p-6 hover:glow-box transition-all duration-500 rounded-cyber flex flex-col justify-between space-y-6 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 border-b border-accent-gold/20 pb-3">
              <h3 className="font-display font-bold text-sm text-white group-hover:text-accent-gold transition-colors">Золотой Час</h3>
              <span className="text-[9px] font-bold text-black bg-accent-gold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,191,0,0.5)]">Легкий</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-light flex-grow">Свежесть сицилийского лимона, сладость спелого манго и прохладное послевкусие перечной мяты. Освежающий выбор для расслабленного вечера.</p>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Classic Line</span>
              <div className="text-xs font-bold text-accent-gold tracking-widest glow-text">2 200 ₽</div>
            </div>
          </div>
          {/* Menu Card 3 */}
          <div className="liquid-glass border border-white/10 p-6 hover:glow-box transition-all duration-500 rounded-cyber flex flex-col justify-between space-y-6 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 border-b border-accent-gold/20 pb-3">
              <h3 className="font-display font-bold text-sm text-white group-hover:text-accent-gold transition-colors">Янтарный Туман</h3>
              <span className="text-[9px] font-bold text-black bg-accent-gold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,191,0,0.5)]">Средний</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-light flex-grow">Сложный бленд с ароматом пряной корицы, печеного яблока и сладкой карамели. Создает теплую, уютную атмосферу неонового вечера.</p>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Signature Line</span>
              <div className="text-xs font-bold text-accent-gold tracking-widest glow-text">2 500 ₽</div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Zone Layout matching reference image perfectly */}
      <section id="menu" className="relative pt-8">
        <div className="text-center space-y-2 mb-10 select-none">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent-gold font-semibold">
            <Flame className="w-3.5 h-3.5 inline mr-1 text-accent-gold animate-pulse" /> НАШИ ЗОНЫ
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider">
            Выберите <span className="gradient-text font-semibold italic">атмосферу</span>
          </h2>
        </div>

        <div className="flex items-center gap-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
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
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Black gradient mask matching reference image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/70 group-hover:via-black/25 transition-colors duration-300" />
                </div>

                {/* Card content aligned top-left matching reference design */}
                <div className="absolute top-6 left-6 right-6 z-10 flex flex-col justify-start items-start">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-white leading-none uppercase tracking-wide group-hover:text-accent-gold transition-colors duration-300">
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

          {/* Vertical scroll/navigation chevrons on the right */}
          <div className="hidden md:flex flex-col gap-3 justify-center items-center">
            <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-[#131313]/90 border border-white/5 text-white/50 hover:border-accent-gold hover:text-accent-gold transition-all">
              <ChevronLeft className="w-4 h-4 rotate-90" />
            </button>
            <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-[#131313]/90 border border-white/5 text-white/50 hover:border-accent-gold hover:text-accent-gold transition-all">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {[
            { title: 'Премиальное качество', desc: 'Только отборные табаки и качественные смеси', iconName: 'award' as const },
            { title: 'Идеальная крепость', desc: 'Готовим на 4 углях под баней без перегрева и горечи', iconName: 'flame' as const },
            { title: 'Круглосуточно 24/7', desc: 'Мы работаем для вас в любое время суток', iconName: 'clock' as const },
            { title: 'Комфорт и атмосфера', desc: 'Стильный интерьер и уютная атмосфера для отдыха', iconName: 'compass' as const },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onMouseMove={(e) => handleCardMouseMove(e)}
              onMouseEnter={() => setHoveredCardIndex(index)}
              onMouseLeave={() => setHoveredCardIndex(null)}
              className="relative rounded-[28px] overflow-hidden group"
            >
              {/* Dynamic spotlight glow that follows coordinates cursor relative */}
              {hoveredCardIndex === index && (
                <div
                  className="absolute pointer-events-none rounded-[28px] transition-opacity duration-300"
                  style={{
                    width: '320px',
                    height: '320px',
                    background: 'radial-gradient(120px circle at var(--x) var(--y), rgba(255, 191, 0, 0.15), transparent 80%)',
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
                  <Flame className="w-3.5 h-3.5 text-accent-gold animate-pulse" /> КОНСТРУКТОР ВКУСОВ
                </span>
                <h3 className="text-3xl sm:text-4xl font-display font-light text-white uppercase tracking-wider leading-none">
                  Создайте идеальный <span className="gradient-text font-semibold italic">микс</span>
                </h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
                  Смешивайте крепость, чаши, жидкую основу и до 4 вкусов в реальном времени. Сгенерируйте QR-код и покажите вашему кальянному мастеру.
                </p>
              </div>

              <div className="pt-6 z-10">
                <NavLink to="/mixologist">
                  <motion.button
                    className="px-8 py-3.5 rounded-full border border-[#FFBF00]/40 text-white bg-gradient-to-r from-[#6d28d9] to-[#311082] hover:from-[#7c3aed] hover:to-[#4c1d95] shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:shadow-[0_0_20px_rgba(255, 191, 0,0.35)] flex items-center justify-center gap-2 text-sm font-semibold transition-all w-full sm:w-auto"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Flame className="w-4 h-4 text-accent-gold animate-pulse" /> Открыть конструктор
                  </motion.button>
                </NavLink>
              </div>
            </GlassCard>
          </div>

          {/* VIP Pass Panel */}
          <div className="lg:col-span-4">
            <GlassCard className="p-8 h-full flex flex-col justify-between bg-gradient-to-br from-[#131313]/95 via-[#131313]/98 to-black border-accent-gold/35 relative overflow-hidden text-center group min-h-[320px] z-10">
              {/* Decorative corners matching reference VIP layout */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-accent-gold/60 pointer-events-none" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-accent-gold/60 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-accent-gold/60 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-accent-gold/60 pointer-events-none" />
              
              <div className="space-y-4 z-10 mt-4">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent-gold/90 font-bold block">Закрытый Клуб</span>
                <h4 className="text-5xl font-display font-bold text-accent-gold tracking-widest animate-pulse">VIP</h4>
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
      <section id="map" className="relative pt-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
          <GlowIcon name="mappin" color="gold" size={20} className="flex-shrink-0" /> Как нас найти
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard className="overflow-hidden p-0 border border-glass-border shadow-lg">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=47.2734%2C56.1365&z=17&pt=47.2734%2C56.1365%2Cpm2rdm&lang=ru_RU"
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
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleAddressClick(); }}
                      className="text-[11px] text-accent-gold hover:underline mt-1 inline-block"
                    >
                      Открыть на карте →
                    </a>
                    {localStorage.getItem('preferred_map_service') && (
                      <button
                        onClick={() => { localStorage.removeItem('preferred_map_service'); setShowMapPicker(true); }}
                        className="text-[9px] text-white/25 hover:text-white/50 ml-2 transition-colors"
                      >
                        (сменить сервис карт)
                      </button>
                    )}
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
                  <GlowIcon name="send" color="cyan" size={16} className="flex-shrink-0" />
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
      {/* Map Service Picker Modal */}
      <AnimatePresence>
        {showMapPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMapPicker(false)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-gradient-to-b from-[#1a1a1a] to-[#0e0e0e] border border-accent-gold/20 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#ffbf00_0%,transparent_70%)] pointer-events-none" />
              <div className="relative z-10 space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-display font-bold text-white">Открыть на карте</h3>
                  <p className="text-[11px] text-white/40">Выберите удобный сервис карт. Ваш выбор будет сохранён.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MAP_SERVICES.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => handleMapServiceSelect(svc.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{svc.icon}</span>
                      <span className="text-xs font-semibold text-white/80 group-hover:text-accent-gold transition-colors">{svc.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="w-full py-2.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
