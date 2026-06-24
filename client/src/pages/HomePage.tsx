import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { MixCarousel3D } from '@/components/MixCarousel3D';
import { HookahScene } from '@/components/three/HookahScene';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import { CONTACT, WORKING_HOURS } from '@/config/seats';
import type { Promo } from '@/types';
import { staggerContainer, fadeUp } from '@/lib/motion';

type ShowcaseItem = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
};

const statItems = [
  { value: '24/7', label: 'Работаем' },
  { value: '120+', label: 'Вкусов' },
  { value: '5000+', label: 'Гостей' },
];

const advantageItems = [
  { value: '120+', label: 'вкусов', desc: 'Авторские миксы и премиальные табаки' },
  { value: '24/7', label: 'работаем', desc: 'Без выходных и перерывов' },
  { value: 'VIP', label: 'комнаты', desc: 'Приватные залы для особых гостей' },
  { value: '4 мин', label: 'до подачи', desc: 'Быстрая подача к вашему столу' },
];

export function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const hookahSectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const { scrollYProgress: hookahProgress } = useScroll({
    target: hookahSectionRef,
    offset: ['start center', 'end center'],
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [bowlIndex, setBowlIndex] = useState(0);
  const [liquidIndex, setLiquidIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const unsub1 = hookahProgress.on('change', (v) => {
      const clamped = Math.min(1, Math.max(0, v));
      const idx = Math.min(4, Math.floor(clamped * 5));
      setBowlIndex(idx);
      setLiquidIndex(idx);
    });
    return () => { unsub1(); };
  }, [hookahProgress, prefersReducedMotion]);

  const hookahScale = useTransform(hookahProgress, [0, 1], [0.85, 1]);
  const hookahOpacity = useTransform(hookahProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  const BOWL_INFO = useMemo(() => [
    { name: 'Cosmo Bowl', desc: 'Классическая глиняная чаша с матовой поверхностью для идеального прогрева', liquid: 'Вода с блёстками' },
    { name: 'Грейпфрут', desc: 'Свежая половинка грейпфрута с текстурой цедры для цитрусовой ноты', liquid: 'Вино' },
    { name: 'Кактус', desc: 'Маленький зелёный кактус с колючками — экзотическая подача', liquid: 'Кола' },
    { name: 'Ананас', desc: 'Тропический ананас с лиственной короной для яркой сервировки', liquid: 'Апельсиновый сок' },
    { name: 'Апельсин', desc: 'Сочная апельсиновая чаша с насыщенной текстурой кожуры', liquid: 'Чистая вода' },
  ], []);

  const [promos, setPromos] = useState<Promo[]>([]);
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.querySelector(hash);
    if (!el) return;
    const timer = setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    api<Promo[]>('/api/promos', { signal: ac.signal })
      .then((data) => setPromos(data))
      .catch(() => {});
    api<ShowcaseItem[]>('/api/showcases', { signal: ac.signal })
      .then((data) => setShowcaseItems(data?.filter(s => s.is_active) || []))
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const handleAddressClick = () => {
    window.open('https://yandex.ru/maps/-/CDT1Z-pC', '_blank');
  };

  return (
    <div className="overflow-x-hidden bg-dark-bg">
      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center overflow-hidden"
      >
        {/* Background image with cinematic overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=2070&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-dark-bg/20" />
          <div className="absolute inset-0 bg-vignette pointer-events-none" />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12"
          style={prefersReducedMotion ? {} : { y: heroParallax, opacity: heroOpacity }}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="text-xs uppercase tracking-[0.25em] text-gold-DEFAULT font-medium">
                  SPORT LOUNGE
                </span>
              </motion.div>

              <motion.h1
                className="font-heading text-[clamp(48px,6vw,96px)] font-semibold leading-[0.95] text-text-primary tracking-[-0.03em]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              >
                Истинный вкус
                <br />
                <span className="gradient-text">и крепость</span>
              </motion.h1>

              <motion.p
                className="text-text-secondary text-sm leading-relaxed max-w-md font-light"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                Премиальный лаунж с изысканным обслуживанием и авторскими кальянами. Сделайте заказ прямо за свой стол.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <NavLink to="/booking">
                  <button className="btn-primary px-8 py-3.5">
                    Забронировать
                  </button>
                </NavLink>
                <NavLink to="/booking">
                  <button className="btn-secondary px-8 py-3.5">
                    Конструктор вкусов
                  </button>
                </NavLink>
              </motion.div>
            </div>

            {/* Right — hookah 3D scene */}
            <motion.div
              className="hidden lg:block relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="aspect-[4/5] max-w-md mx-auto relative bg-dark-bg rounded-glass overflow-hidden ring-1 ring-inset ring-white/5">
                <HookahScene bowlIndex={bowlIndex} liquidIndex={liquidIndex} />
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(176,141,87,0.1)]">
                  <motion.div
                    className="h-full bg-gold-DEFAULT origin-left"
                    style={{ scaleX: hookahProgress }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-gold-DEFAULT/40 to-transparent" />
        </motion.div>
      </section>

      {/* ─── HOOKAH SHOWCASE ─── */}
      <section ref={hookahSectionRef} className="relative border-b border-dark-border">
          <div className="relative h-[500vh]">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">
              <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Left — hookah scene */}
                <motion.div
                  className="h-[50vh] lg:h-[70vh] relative"
                  style={{ scale: hookahScale, opacity: hookahOpacity }}
                >
                  <HookahScene bowlIndex={bowlIndex} liquidIndex={liquidIndex} />
                  {/* Progress dots */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    {BOWL_INFO.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors duration-700 ${i <= bowlIndex ? 'bg-gold-DEFAULT' : 'bg-white/5'}`}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Right — bowl description */}
                <motion.div
                  className="hidden lg:flex flex-col justify-center space-y-6"
                  key={bowlIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  viewport={{ once: false }}
                >
                  <span className="text-xs uppercase tracking-[0.25em] text-gold-DEFAULT font-medium">
                    Чаша {bowlIndex + 1} / {BOWL_INFO.length}
                  </span>
                  <h2 className="font-heading text-[clamp(28px,4vw,56px)] font-semibold text-text-primary leading-[1.1] tracking-[-0.02em]">
                    {BOWL_INFO[bowlIndex].name}
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed max-w-md font-light">
                    {BOWL_INFO[bowlIndex].desc}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="text-gold-DEFAULT">Жидкость:</span>
                    <span>{BOWL_INFO[bowlIndex].liquid}</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section className="py-section border-b border-dark-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              className="grid grid-cols-3 gap-12 lg:gap-24"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-80px' }}
            >
              {statItems.map((item) => (
                <motion.div key={item.label} variants={fadeUp} className="text-center">
                  <p className="font-heading text-[clamp(36px,5vw,72px)] font-semibold text-gold-DEFAULT tracking-[-0.03em] leading-none">
                    {item.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-secondary mt-3 font-medium">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── ADVANTAGES ─── */}
        <section className="py-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-dark-border"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-80px' }}
            >
              {advantageItems.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="bg-dark-bg p-8 lg:p-12 flex flex-col justify-between min-h-[240px]"
                >
                  <p className="font-heading text-[clamp(32px,4vw,56px)] font-semibold text-gold-DEFAULT tracking-[-0.03em] leading-none">
                    {item.value}
                  </p>
                  <div>
                    <p className="text-sm uppercase tracking-[0.15em] text-text-primary font-medium mb-1">
                      {item.label}
                    </p>
                    <p className="text-xs text-text-secondary font-light leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── VIP BANNER ─── */}
        <section className="h-[400px] lg:h-[500px] relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.p
              className="font-heading text-[clamp(72px,12vw,180px)] font-semibold text-white/10 tracking-[-0.03em] select-none"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              VIP CLUB
            </motion.p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 max-w-7xl mx-auto">
            <motion.p
              className="font-heading text-[clamp(24px,3vw,40px)] font-semibold text-text-primary tracking-[-0.02em]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              Приватные залы для особых гостей
            </motion.p>
          </div>
        </section>

        {/* ─── SHOWCASE / COLLECTION ─── */}
        <section className="py-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="text-xs uppercase tracking-[0.2em] text-gold-DEFAULT font-medium">
                Коллекция
              </span>
              <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-semibold text-text-primary tracking-[-0.03em]">
                Выберите свой вкус
              </h2>
              <div className="luxury-divider max-w-[120px] mx-auto mt-4" />
            </motion.div>

            <MixCarousel3D
              items={showcaseItems.length > 0 ? showcaseItems.map(s => ({
                id: s.id,
                title: s.title,
                subtitle: s.description,
                imageUrl: s.image_url ? resolveImageUrl(s.image_url) : undefined,
                linkUrl: s.link_url,
              })) : [
                { id: '1', title: 'Премиум табаки', subtitle: 'Отборные сорта', gradient: 'linear-gradient(135deg, #0A0C0E 0%, #0F1216 100%)' },
                { id: '2', title: 'Авторские миксы', subtitle: 'Шеф-миксолог рекомендует', gradient: 'linear-gradient(135deg, #0A0C0E 0%, #0F1216 100%)' },
                { id: '3', title: 'VIP-залы', subtitle: 'Для особых гостей', gradient: 'linear-gradient(135deg, #0A0C0E 0%, #0F1216 100%)' },
              ]}
              onItemClick={(item) => {
                if (item.linkUrl) window.open(item.linkUrl, '_blank');
                else if (item.id.length < 5) window.location.href = '/booking';
              }}
            />
          </div>
        </section>

        {/* ─── CONSTRUCTOR CTA ─── */}
        <section className="py-section border-t border-dark-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="text-xs uppercase tracking-[0.2em] text-gold-DEFAULT font-medium">
                  Конструктор вкусов
                </span>
                <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-semibold text-text-primary tracking-[-0.03em]">
                  Создайте идеальный микс
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed font-light max-w-md">
                  Смешивайте крепость, чаши и до 4 вкусов в реальном времени. 
                  Сгенерируйте QR-код и покажите вашему кальянному мастеру.
                </p>
                <NavLink to="/booking">
                  <button className="btn-primary px-8 py-3.5">
                    Открыть конструктор
                  </button>
                </NavLink>
              </motion.div>

              <motion.div
                className="aspect-[4/5] max-w-sm mx-auto w-full relative"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              >
                <img
                  src="https://images.unsplash.com/photo-1588681664899-142c07d0c18a?q=80&w=800&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover rounded-glass"
                />
                <div className="absolute inset-0 rounded-glass ring-1 ring-inset ring-white/5" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── MENU ─── */}
        <section className="py-section border-t border-dark-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="text-xs uppercase tracking-[0.2em] text-gold-DEFAULT font-medium">
                Меню
              </span>
              <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-semibold text-text-primary tracking-[-0.03em]">
                Наши позиции
              </h2>
              <div className="luxury-divider max-w-[120px] mx-auto mt-4" />
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { name: 'Классический', desc: 'Традиционная табачная смесь', price: '1500 ₽', strength: 'Medium', img: 'https://images.unsplash.com/photo-1588681664899-142c07d0c18a?q=80&w=400&auto=format&fit=crop' },
                { name: 'Премиум', desc: 'Элитные табаки high-end', price: '2500 ₽', strength: 'Strong', img: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=400&auto=format&fit=crop' },
                { name: 'Фруктовый микс', desc: 'Микс на основе свежих фруктов', price: '1800 ₽', strength: 'Light', img: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=400&auto=format&fit=crop' },
                { name: 'Авторский', desc: 'От шеф-миксолога заведения', price: '3000 ₽', strength: 'Medium', img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400&auto=format&fit=crop' },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="aspect-[4/5] relative overflow-hidden rounded-glass bg-dark-surface">
                    <img
                      src={item.img}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                      <p className="font-heading text-sm lg:text-base font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-text-secondary mt-1 font-light">{item.desc}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gold-DEFAULT font-medium">{item.price}</span>
                        <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">{item.strength}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CONTACTS ─── */}
        <section className="py-section border-t border-dark-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-5 gap-16">
              {/* Map */}
              <motion.div
                className="lg:col-span-3 rounded-glass overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <iframe
                  src="https://yandex.ru/map-widget/v1/?ll=47.2725%2C56.1366&z=17&pt=47.2725%2C56.1366%2Cpm2rdm&lang=ru_RU"
                  width="100%"
                  height="400"
                  style={{ border: 0, display: 'block', filter: 'invert(1) hue-rotate(180deg) saturate(0.5) brightness(0.8)' }}
                  allowFullScreen
                  loading="lazy"
                  title="Sport Lounge на карте"
                />
              </motion.div>

              {/* Contact info */}
              <motion.div
                className="lg:col-span-2 space-y-8 flex flex-col justify-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold-DEFAULT font-medium">
                    Контакты
                  </p>
                  <p className="font-heading text-[clamp(20px,2.5vw,36px)] font-semibold text-text-primary tracking-[-0.02em]">
                    {CONTACT.address}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-3 gold-border-bottom">
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Часы работы</p>
                    <p className="text-sm text-text-primary font-heading">{WORKING_HOURS}</p>
                  </div>
                  <div className="flex items-center justify-between py-3 gold-border-bottom">
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Telegram</p>
                    <a
                      href={CONTACT.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-DEFAULT font-heading text-lg font-semibold hover:text-gold-light transition-colors"
                    >
                      @{CONTACT.telegram}
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleAddressClick}
                  className="btn-primary"
                >
                  Построить маршрут
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── PROMOS ─── */}
        {promos.length > 0 && (
          <section className="py-section border-t border-dark-border">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <motion.h2
                className="font-heading text-[clamp(24px,3vw,40px)] font-semibold text-text-primary tracking-[-0.03em] mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                Специальные предложения
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {promos.map((promo, i) => (
                  <motion.div
                    key={promo._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <GlassCard variant="premium" className="p-4 h-full">
                      {promo.imageUrl && (
                        <img
                          src={resolveImageUrl(promo.imageUrl)}
                          alt={promo.title}
                          loading="lazy"
                          className="w-full h-32 object-cover rounded-[12px] mb-3"
                        />
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-medium text-text-primary truncate">{promo.title}</h4>
                        {promo.discountPercent && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gold-subtle text-gold-DEFAULT border border-gold-DEFAULT/20">
                            -{promo.discountPercent}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{promo.description}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── FOOTER ─── */}
        <footer className="relative py-section border-t border-dark-border">
          <div className="absolute top-0 left-0 right-0 h-px bg-gold-fade pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <p className="font-heading text-lg font-semibold text-gold-DEFAULT tracking-[0.15em]">
              SPORT LOUNGE
            </p>
            <div className="luxury-divider max-w-[80px] mx-auto my-4" />
            <p className="text-xs text-text-secondary font-light">
              Премиальный лаунж. Чебоксары, ул. Гагарина 40А
            </p>
          </div>
        </footer>
    </div>
  );
}
