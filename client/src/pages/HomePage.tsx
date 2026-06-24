import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MixCarousel3D } from '@/components/MixCarousel3D';
import { HookahScene } from '@/components/three/HookahScene';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';
import { CONTACT, WORKING_HOURS } from '@/config/seats';
import type { Promo } from '@/types';

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
    <div className="overflow-x-hidden bg-[#000000]">
      {/* ─── HERO — Active Theory: void canvas + 3D centerpiece ─── */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Pure black void — no image, no gradient */}
        <div className="absolute inset-0 z-0 bg-[#000000]" />

        {/* 3D Hookah — the ONLY visual subject */}
        <motion.div
          className="relative z-10 w-full max-w-3xl mx-auto px-6"
          style={prefersReducedMotion ? {} : { opacity: heroOpacity }}
        >
          <div className="aspect-square max-w-lg mx-auto relative">
            <HookahScene bowlIndex={bowlIndex} liquidIndex={liquidIndex} />
          </div>
        </motion.div>

        {/* Instrument-panel labels — pushed to corners */}
        <div className="absolute top-6 left-6 z-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            SPORT LOUNGE
          </span>
        </div>

        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          <NavLink
            to="/booking"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 hover:text-white transition-colors"
          >
            ЗАКАЗ
          </NavLink>
          <div className="w-px h-3 bg-white/20" />
          <NavLink
            to="/gallery"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 hover:text-white transition-colors"
          >
            ГАЛЕРЕЯ
          </NavLink>
        </div>

        {/* Scroll indicator — hairline */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </section>

      {/* ─── HOOKAH SHOWCASE — 5vh scroll-driven ─── */}
      <section ref={hookahSectionRef} className="relative">
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
                      className={`w-2 h-2 rounded-full transition-colors duration-700 ${i <= bowlIndex ? 'bg-white/60' : 'bg-white/10'}`}
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
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                  Чаша {bowlIndex + 1} / {BOWL_INFO.length}
                </span>
                <h2 className="font-heading text-[clamp(28px,4vw,56px)] font-semibold text-white leading-[1.1] tracking-[-0.02em]">
                  {BOWL_INFO[bowlIndex].name}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed max-w-md font-light">
                  {BOWL_INFO[bowlIndex].desc}
                </p>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                  <span className="text-white/60">Жидкость:</span>
                  <span>{BOWL_INFO[bowlIndex].liquid}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS — minimal instrument-panel labels ─── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-3 gap-12 lg:gap-24">
            {[
              { value: '24/7', label: 'Работаем' },
              { value: '120+', label: 'Вкусов' },
              { value: '5000+', label: 'Гостей' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-heading text-[clamp(36px,5vw,72px)] font-semibold text-white tracking-[-0.03em] leading-none">
                  {item.value}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mt-3">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ADVANTAGES — hairline-separated zones ─── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {[
              { value: '120+', label: 'вкусов', desc: 'Авторские миксы и премиальные табаки' },
              { value: '24/7', label: 'работаем', desc: 'Без выходных и перерывов' },
              { value: 'VIP', label: 'комнаты', desc: 'Приватные залы для особых гостей' },
              { value: '4 мин', label: 'до подачи', desc: 'Быстрая подача к вашему столу' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#000000] p-8 lg:p-12 flex flex-col justify-between min-h-[240px]"
              >
                <p className="font-heading text-[clamp(32px,4vw,56px)] font-semibold text-white tracking-[-0.03em] leading-none">
                  {item.value}
                </p>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 mb-1">
                    {item.label}
                  </p>
                  <p className="font-mono text-[10px] text-white/30 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SHOWCASE / COLLECTION ─── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center space-y-4 mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Коллекция
            </span>
            <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-semibold text-white tracking-[-0.03em]">
              Выберите свой вкус
            </h2>
            <div className="luxury-divider max-w-[120px] mx-auto mt-4" />
          </div>

          <MixCarousel3D
            items={showcaseItems.length > 0 ? showcaseItems.map(s => ({
              id: s.id,
              title: s.title,
              subtitle: s.description,
              imageUrl: s.image_url ? resolveImageUrl(s.image_url) : undefined,
              linkUrl: s.link_url,
            })) : [
              { id: '1', title: 'Премиум табаки', subtitle: 'Отборные сорта', gradient: 'linear-gradient(135deg, #000000 0%, #0A0C0E 100%)' },
              { id: '2', title: 'Авторские миксы', subtitle: 'Шеф-миксолог рекомендует', gradient: 'linear-gradient(135deg, #000000 0%, #0A0C0E 100%)' },
              { id: '3', title: 'VIP-залы', subtitle: 'Для особых гостей', gradient: 'linear-gradient(135deg, #000000 0%, #0A0C0E 100%)' },
            ]}
            onItemClick={(item) => {
              if (item.linkUrl) window.open(item.linkUrl, '_blank');
              else if (item.id.length < 5) window.location.href = '/booking';
            }}
          />
        </div>
      </section>

      {/* ─── MENU — sparse instrument-panel layout ─── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center space-y-4 mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Меню
            </span>
            <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-semibold text-white tracking-[-0.03em]">
              Наши позиции
            </h2>
            <div className="luxury-divider max-w-[120px] mx-auto mt-4" />
          </div>

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
                <div className="aspect-[4/5] relative overflow-hidden bg-[#000000] border border-white/5">
                  <img
                    src={item.img}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                    <p className="font-heading text-sm lg:text-base font-semibold text-white">{item.name}</p>
                    <p className="font-mono text-[10px] text-white/40 mt-1">{item.desc}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-[10px] text-white/60">{item.price}</span>
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">{item.strength}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACTS ─── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Map */}
            <div className="lg:col-span-3 overflow-hidden border border-white/5">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=47.2725%2C56.1366&z=17&pt=47.2725%2C56.1366%2Cpm2rdm&lang=ru_RU"
                width="100%"
                height="400"
                style={{ border: 0, display: 'block', filter: 'invert(1) hue-rotate(180deg) saturate(0) brightness(0.3)' }}
                allowFullScreen
                loading="lazy"
                title="Sport Lounge на карте"
              />
            </div>

            {/* Contact info */}
            <div className="lg:col-span-2 space-y-8 flex flex-col justify-center">
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Контакты
                </p>
                <p className="font-heading text-[clamp(20px,2.5vw,36px)] font-semibold text-white tracking-[-0.02em]">
                  {CONTACT.address}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Часы работы</p>
                  <p className="font-mono text-[11px] text-white/60">{WORKING_HOURS}</p>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Telegram</p>
                  <a
                    href={CONTACT.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-white/60 hover:text-white transition-colors"
                  >
                    @{CONTACT.telegram}
                  </a>
                </div>
              </div>

              <button
                onClick={handleAddressClick}
                className="btn-secondary self-start"
              >
                Построить маршрут
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROMOS ─── */}
      {promos.length > 0 && (
        <section className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <h2 className="font-heading text-[clamp(24px,3vw,40px)] font-semibold text-white tracking-[-0.03em] mb-12">
              Специальные предложения
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {promos.map((promo, i) => (
                <motion.div
                  key={promo._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="p-4 h-full border border-white/5 bg-[#000000]">
                    {promo.imageUrl && (
                      <img
                        src={resolveImageUrl(promo.imageUrl)}
                        alt={promo.title}
                        loading="lazy"
                        className="w-full h-32 object-cover mb-3 opacity-60"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="font-mono text-[11px] text-white/80 truncate">{promo.title}</h4>
                      {promo.discountPercent && (
                        <span className="font-mono text-[10px] px-2 py-0.5 border border-white/10 text-white/40">
                          -{promo.discountPercent}%
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-white/30 leading-relaxed">{promo.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FOOTER — minimal label ─── */}
      <footer className="relative py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
            SPORT LOUNGE
          </p>
          <div className="luxury-divider max-w-[80px] mx-auto my-4" />
          <p className="font-mono text-[10px] text-white/20">
            Чебоксары, ул. Гагарина 40А
          </p>
        </div>
      </footer>
    </div>
  );
}
