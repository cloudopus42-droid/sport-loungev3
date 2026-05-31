import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Send, Award, Flame, Gauge, MessageSquare, X, Share2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { HOOKAH_FLAVORS, FLAVOR_CATEGORIES } from '@/config/seats';
import { ThreeDNA } from '@/components/ThreeDNA';

const BOWL_TYPES = [
  { id: 'clay', name: 'Глиняная чаша', price: 1200, emoji: '🏺', desc: 'Классическая тяга, чистая вкусопередача' },
  { id: 'grapefruit', name: 'На грейпфруте', price: 1500, emoji: '🍊', desc: 'Придает мягкую цитрусовую кислинку' },
  { id: 'pineapple', name: 'На ананасе', price: 1700, emoji: '🍍', desc: 'Увеличивает сладость и время курения' },
  { id: 'pomelo', name: 'На помело', price: 1800, emoji: '🍈', desc: 'Максимальный объем чаши и мягкость пара' },
];

const LIQUID_BASES = [
  { id: 'water', name: 'На воде', price: 0, emoji: '💧', desc: 'Классическая легкая фильтрация' },
  { id: 'milk', name: 'На молоке', price: 150, emoji: '🥛', desc: 'Делает пар более плотным и нежным' },
  { id: 'juice', name: 'На соке', price: 200, emoji: '🍹', desc: 'Усиливает фруктовые и ягодные оттенки' },
  { id: 'wine', name: 'На вине / Коктейле', price: 450, emoji: '🍷', desc: 'Эксклюзивная алкогольная ароматика' },
];

export function BookingPage() {
  const { isAuthenticated } = useAuth();

  const [hookahMix, setHookahMix] = useState<string[]>([]);
  const [mixPercentages, setMixPercentages] = useState<Record<string, number>>({});
  const [hookahStrength, setHookahStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [bowlType, setBowlType] = useState('clay');
  const [liquidBase, setLiquidBase] = useState('water');
  const [flavorCategory, setFlavorCategory] = useState('Все');
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const triggerHaptic = (ms: number = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (err) {}
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('prefilled_mix');
      if (saved) {
        const mix = JSON.parse(saved);
        if (mix.bowlType) setBowlType(mix.bowlType);
        if (mix.liquidBase) setLiquidBase(mix.liquidBase);
        if (mix.hookahStrength) setHookahStrength(mix.hookahStrength);
        if (mix.hookahMix) setHookahMix(mix.hookahMix);
        if (mix.mixPercentages) setMixPercentages(mix.mixPercentages);
        if (mix.comment) setComment(mix.comment);
        localStorage.removeItem('prefilled_mix');
        showToast('Рецепт успешно загружен в конструктор!', 'success');
      }
    } catch (e) {
      console.warn('Failed to load prefilled mix:', e);
    }
  }, []);

  const handlePublishToFeed = async () => {
    if (!ticketData) return;
    setPublishing(true);
    try {
      const response = await fetch('/icon-512.png');
      const blob = await response.blob();
      const imageFile = new File([blob], 'recipe-hookah.png', { type: 'image/png' });

      const fd = new FormData();
      fd.append('title', `Рецепт ${ticketData.ticketId}`);
      fd.append('description', `На чаше: ${ticketData.bowl}\nБаза: ${ticketData.base}\nКрепость: ${ticketData.strength}\nМикс: ${ticketData.mix}\n"${ticketData.comment}"`);
      fd.append('image', imageFile);

      await api.post('/api/posts', fd);
      showToast('Ваш рецепт опубликован в ленту!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Не удалось опубликовать рецепт', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const selectedBowl = BOWL_TYPES.find(b => b.id === bowlType) || BOWL_TYPES[0];
  const selectedBase = LIQUID_BASES.find(l => l.id === liquidBase) || LIQUID_BASES[0];
  const totalPrice = selectedBowl.price + selectedBase.price;

  const updateMixFlavors = (name: string) => {
    triggerHaptic(15);
    let nextMix = [...hookahMix];
    const selected = nextMix.includes(name);
    if (selected) {
      nextMix = nextMix.filter(n => n !== name);
    } else {
      if (nextMix.length >= 4) {
        showToast('Максимум 4 вкуса в миксе', 'error');
        return;
      }
      nextMix.push(name);
    }
    
    // Equal shares distribution initially
    const count = nextMix.length;
    const newPercentages: Record<string, number> = {};
    if (count > 0) {
      const share = Math.floor(100 / count);
      nextMix.forEach((n, idx) => {
        newPercentages[n] = idx === count - 1 ? 100 - share * (count - 1) : share;
      });
    }
    
    setHookahMix(nextMix);
    setMixPercentages(newPercentages);
  };

  const handlePercentageChange = (name: string, val: number) => {
    if (val % 5 === 0) {
      triggerHaptic(10);
    }
    const nextPerc = { ...mixPercentages, [name]: val };
    const keys = Object.keys(nextPerc).filter(k => k !== name);
    if (keys.length === 0) return;
    
    const remaining = 100 - val;
    const sumOthers = keys.reduce((s, k) => s + (mixPercentages[k] || 0), 0);
    
    keys.forEach(k => {
      if (sumOthers > 0) {
        nextPerc[k] = Math.round((mixPercentages[k] / sumOthers) * remaining);
      } else {
        nextPerc[k] = Math.round(remaining / keys.length);
      }
    });
    
    // Normalization check to sum exactly to 100%
    const total = Object.values(nextPerc).reduce((s, v) => s + v, 0);
    if (total !== 100 && keys.length > 0) {
      nextPerc[keys[0]] += (100 - total);
    }
    setMixPercentages(nextPerc);
  };

  const getMixCharacteristics = () => {
    let sweetness = 0;
    let freshness = 0;
    let sourness = 0;
    let strength = hookahStrength === 'light' ? 30 : hookahStrength === 'medium' ? 60 : 90;
    
    hookahMix.forEach(name => {
      const pct = (mixPercentages[name] || 0) / 100;
      const fl = HOOKAH_FLAVORS.find(f => f.name === name);
      if (!fl) return;
      
      if (fl.category === 'Фрукты') { sweetness += 70 * pct; sourness += 30 * pct; }
      else if (fl.category === 'Ягоды') { sweetness += 50 * pct; sourness += 50 * pct; }
      else if (fl.category === 'Десерт') { sweetness += 90 * pct; }
      else if (fl.category === 'Свежие') { freshness += 90 * pct; }
      else if (fl.category === 'Пряные') { sweetness += 30 * pct; strength += 20 * pct; }
      else if (fl.category === 'Авторские') { sweetness += 50 * pct; freshness += 40 * pct; sourness += 30 * pct; }
    });
    
    return {
      sweetness: Math.min(100, Math.round(sweetness)),
      freshness: Math.min(100, Math.round(freshness)),
      sourness: Math.min(100, Math.round(sourness)),
      strength: Math.min(100, Math.round(strength)),
    };
  };

  const chars = getMixCharacteristics();

  const handleGenerateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hookahMix.length === 0) {
      showToast('Выберите хотя бы один вкус для микса', 'error');
      return;
    }

    setLoading(true);
    try {
      const mixString = hookahMix.map(name => `${name} (${mixPercentages[name] || 0}%)`).join(', ');
      const strengthLabel = hookahStrength === 'light' ? 'Лёгкий' : hookahStrength === 'medium' ? 'Средний' : 'Крепкий';
      
      const recipeData = {
        strength: strengthLabel,
        bowl: selectedBowl.name,
        base: selectedBase.name,
        mix: mixString,
        price: totalPrice,
        comment: comment || 'Без комментариев',
        phone: phone || 'Не указан',
        ticketId: `MIX-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`
      };

      // If authenticated, save the mix in the background
      if (isAuthenticated) {
        try {
          await api.post('/api/bookings', {
            seatId: recipeData.ticketId,
            seatLabel: 'Микс-билет',
            seatZone: 'hall',
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toTimeString().slice(0, 5),
            guestsCount: 1,
            phone: phone || '79991234567',
            hookahMix: `${selectedBowl.name} | ${selectedBase.name} | Mix: ${mixString}`,
            hookahStrength,
            hookahCount: 1,
            comment: comment || undefined,
          });
        } catch (dbErr) {
          console.warn('Could not save mix booking to server:', dbErr);
        }
      }

      setTicketData(recipeData);
      setShowTicket(true);
      showToast('Билет микса успешно сгенерирован!', 'success');
    } catch (err) {
      showToast('Ошибка при генерации билета', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTelegramShareUrl = () => {
    if (!ticketData) return '#';
    const text = `💨 *НОВЫЙ КАЛЬЯННЫЙ МИКС (${ticketData.ticketId})*\n\n` +
      `🏺 Чаша: *${ticketData.bowl}*\n` +
      `💧 База: *${ticketData.base}*\n` +
      `⚡ Крепость: *${ticketData.strength}*\n` +
      `🍓 Микс вкусов: *${ticketData.mix}*\n` +
      `💬 Пожелания: _${ticketData.comment}_\n` +
      `💵 Стоимость: *${ticketData.price} ₽*`;
    return `https://t.me/NHSC_founder?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center select-none">
        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold font-bold flex items-center justify-center gap-1.5 mb-1.5">
          <Flame className="w-4 h-4 text-accent-gold animate-pulse" /> КОНСТРУКТОР КАЛЬЯНОВ
        </span>
        <h1 className="text-3xl font-display font-light text-white uppercase tracking-wider">
          Миксолог <span className="gradient-text font-semibold italic">Pro v2</span>
        </h1>
        <p className="text-xs text-white/50 mt-1 font-light">
          Создайте уникальный рецепт под собственные предпочтения и получите QR-код для мастера
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Mixologist controls */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Flavor customizer */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-0">
              <Award className="w-4 h-4 text-accent-gold" /> Выберите вкусы табака (до 4 видов)
            </h3>

            {/* Category filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 border-b border-glass-border/10">
              {FLAVOR_CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setFlavorCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all border ${
                    flavorCategory === cat
                      ? 'bg-accent-gold text-black border-accent-gold/20 shadow-glow-gold'
                      : 'text-white/50 hover:text-white hover:bg-white/5 border-transparent'
                  }`}>{cat}</button>
              ))}
            </div>

            {/* Flavor grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto scrollbar-hide pr-1 border-b border-glass-border/10 pb-3">
              {HOOKAH_FLAVORS
                .filter(f => flavorCategory === 'Все' || f.category === flavorCategory)
                .map(flavor => {
                  const selected = hookahMix.includes(flavor.name);
                  return (
                    <button key={flavor.name} type="button"
                      onClick={() => updateMixFlavors(flavor.name)}
                      className={`px-3 py-2.5 rounded-xl text-xs text-left transition-all flex items-center gap-1.5 ${
                        selected
                          ? 'bg-accent-gold/15 border border-accent-gold/45 text-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                          : 'bg-glass-bg border border-glass-border/60 text-white/60 hover:border-accent-gold/30 hover:text-white/80'
                      }`}>
                      <span className="text-base">{flavor.emoji}</span>
                      <span className="truncate font-semibold">{flavor.name}</span>
                      {selected && <span className="ml-auto text-accent-gold font-bold text-[10px]">✓</span>}
                    </button>
                  );
              })}
            </div>

            {/* dynamic Taste DNA Visualizer */}
            {hookahMix.length > 0 && (
              <motion.div 
                className="space-y-4 bg-white/5 p-4 rounded-2xl border border-glass-border/30 animate-fade-in"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ThreeDNA 
                  mix={hookahMix}
                  mixPercentages={mixPercentages}
                  activeCategory={flavorCategory}
                  onSelectCategory={setFlavorCategory}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-glass-border/10 pt-4">
                  {/* Characteristic meters */}
                  <div className="space-y-2 select-none">
                    <div className="text-[10px] uppercase tracking-wider text-accent-gold font-bold">Свойства микса</div>
                    {[
                      { label: '🍬 Сладость', value: chars.sweetness, color: 'from-yellow-300 to-amber-500' },
                      { label: '❄️ Свежесть', value: chars.freshness, color: 'from-sky-400 to-blue-500' },
                      { label: '🍋 Кислинка', value: chars.sourness, color: 'from-green-400 to-yellow-400' },
                      { label: '⚡ Крепость', value: chars.strength, color: 'from-red-500 to-orange-600' },
                    ].map(item => (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex justify-between text-[9px] text-white/50">
                          <span>{item.label}</span>
                          <span>{item.value}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${item.color} shadow-lg`} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Proportion sliders */}
                  <div className="space-y-3 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-glass-border/10 pt-3 sm:pt-0 sm:pl-4">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Пропорции чаши</div>
                    {hookahMix.map(name => (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-white/80">
                          <span className="truncate max-w-[120px]">{name}</span>
                          <span className="text-accent-gold font-bold">{mixPercentages[name] || 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={mixPercentages[name] || 0}
                          onChange={(e) => handlePercentageChange(name, Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </GlassCard>

          {/* Selectors for Bowl & Liquid Base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bowl selector */}
            <GlassCard className="p-5 space-y-3">
              <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                🏺 Выберите тип чаши
              </h4>
              <div className="space-y-2">
                {BOWL_TYPES.map(b => (
                  <div key={b.id} 
                    onClick={() => { triggerHaptic(20); setBowlType(b.id); }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      bowlType === b.id 
                        ? 'bg-accent-gold/10 border-accent-gold text-white' 
                        : 'bg-glass-bg border-glass-border/60 hover:border-accent-gold/30 text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl bg-black/45 w-9 h-9 rounded-xl flex items-center justify-center border border-white/5">{b.emoji}</span>
                      <div>
                        <div className="text-xs font-semibold">{b.name}</div>
                        <div className="text-[10px] text-white/40 font-light mt-0.5 leading-tight">{b.desc}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent-gold">
                      {b.id === 'clay' ? 'Входит' : `+${b.price - 1200}₽`}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Liquid base selector */}
            <GlassCard className="p-5 space-y-3">
              <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                💧 Выберите основу (жидкость)
              </h4>
              <div className="space-y-2">
                {LIQUID_BASES.map(l => (
                  <div key={l.id} 
                    onClick={() => { triggerHaptic(20); setLiquidBase(l.id); }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      liquidBase === l.id 
                        ? 'bg-accent-gold/10 border-accent-gold text-white' 
                        : 'bg-glass-bg border-glass-border/60 hover:border-accent-gold/30 text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl bg-black/45 w-9 h-9 rounded-xl flex items-center justify-center border border-white/5">{l.emoji}</span>
                      <div>
                        <div className="text-xs font-semibold">{l.name}</div>
                        <div className="text-[10px] text-white/40 font-light mt-0.5 leading-tight">{l.desc}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent-gold">
                      {l.price === 0 ? 'Входит' : `+${l.price}₽`}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right column: Ticket details and generation */}
        <div className="lg:col-span-4">
          <GlassCard className="p-5 space-y-5">
            <form onSubmit={handleGenerateTicket} className="space-y-4">
              <h3 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5 border-b border-glass-border/10 pb-2 mb-0">
                📝 Параметры билета
              </h3>

              {/* Strength dial */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                  <Gauge className="w-3.5 h-3.5" /> Желаемая крепость
                </label>
                <select
                  value={hookahStrength}
                  onChange={(e) => { triggerHaptic(20); setHookahStrength(e.target.value as any); }}
                  className="glass-input text-sm"
                >
                  <option value="light">Лёгкий (Light)</option>
                  <option value="medium">Средний (Medium)</option>
                  <option value="strong">Крепкий (Strong)</option>
                </select>
              </div>

              {/* Optional Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                  📞 Телефон для связи
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="glass-input text-sm"
                />
                <p className="text-[9px] text-white/30 mt-0.5">Необязательно. Помогает сохранить билет в ваш профиль.</p>
              </div>

              {/* Comment */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                  <MessageSquare className="w-3.5 h-3.5" /> Пожелания / Комментарий
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Добавить льда, сделать послаще..."
                  className="glass-input text-sm min-h-[70px] resize-none"
                  rows={3}
                />
              </div>

              {/* Real-time Receipt breakdown */}
              <div className="bg-[#14100c]/85 rounded-2xl p-4 border border-glass-border/20 space-y-2 select-none">
                <div className="text-[9px] uppercase tracking-wider text-accent-gold font-bold">Детализация стоимости</div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Тип чаши:</span>
                  <span>{selectedBowl.price} ₽</span>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Добавка основы:</span>
                  <span>+{selectedBase.price} ₽</span>
                </div>
                <div className="h-px bg-glass-border/10 my-1" />
                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span>Итоговая цена:</span>
                  <span className="text-base text-accent-gold">{totalPrice} ₽</span>
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full py-3 rounded-full border border-accent-gold/60 text-[#F4E4C4] bg-gradient-to-r from-[#7c5c24] to-[#4a3410] hover:from-[#926e2e] hover:to-[#5c4315] shadow-[0_4px_16px_rgba(0,0,0,0.45)] flex items-center justify-center gap-2 text-sm font-bold tracking-wider uppercase transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                <QrCode className="w-4 h-4 text-accent-gold" /> {loading ? 'Генерация...' : 'Получить QR-код'}
              </motion.button>

              {!isAuthenticated && (
                <p className="text-center text-[10px] text-white/30 mt-2 leading-snug">
                  Вы можете заказать билет анонимно. Войдите в <a href="/login" className="text-accent-gold hover:underline font-semibold">аккаунт</a> для сохранения микса.
                </p>
              )}
            </form>
          </GlassCard>
        </div>
      </div>

      {/* Ticket QR Modal */}
      <AnimatePresence>
        {showTicket && ticketData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            {/* Modal Glass Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-sm w-full bg-gradient-to-b from-[#1c1814] to-black rounded-3xl border border-accent-gold/25 p-6 shadow-2xl"
            >
              {/* Close trigger */}
              <button 
                onClick={() => setShowTicket(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Digital Ticket Frame */}
              <div className="text-center space-y-4 pt-2 relative">
                {/* Decorative gold corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-accent-gold/45" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent-gold/45" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-accent-gold/45" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent-gold/45" />

                <span className="text-[9px] uppercase tracking-[0.25em] text-accent-gold font-bold block mb-1">Sport Lounge Recipe Ticket</span>
                <h3 className="text-lg font-display font-semibold text-[#F4E4C4] leading-none">{ticketData.ticketId}</h3>
                
                {/* QR Code fetched dynamically */}
                <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-glow-gold/15 my-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `Id:${ticketData.ticketId}\nBowl:${ticketData.bowl}\nBase:${ticketData.base}\nStrength:${ticketData.strength}\nMix:${ticketData.mix}\nComment:${ticketData.comment}`
                    )}`} 
                    alt="Mix QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-left space-y-2 bg-[#120f0c] p-4 rounded-2xl border border-glass-border/30 text-xs">
                  <div className="flex justify-between text-white/45">
                    <span>Тип чаши:</span>
                    <span className="text-white font-medium">{ticketData.bowl}</span>
                  </div>
                  <div className="flex justify-between text-white/45">
                    <span>Основа:</span>
                    <span className="text-white font-medium">{ticketData.base}</span>
                  </div>
                  <div className="flex justify-between text-white/45">
                    <span>Крепость:</span>
                    <span className="text-white font-medium">{ticketData.strength}</span>
                  </div>
                  <div className="h-px bg-glass-border/10 my-1.5" />
                  <div className="text-white/45 space-y-0.5">
                    <span>Вкусовой микс:</span>
                    <p className="text-accent-gold font-semibold leading-relaxed">{ticketData.mix}</p>
                  </div>
                  <div className="h-px bg-glass-border/10 my-1.5" />
                  <div className="text-white/45 space-y-0.5">
                    <span>Пожелания:</span>
                    <p className="text-white/70 italic leading-snug">"{ticketData.comment}"</p>
                  </div>
                  <div className="h-px bg-glass-border/10 my-1.5" />
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-1">
                    <span>Итого к оплате:</span>
                    <span className="text-accent-gold">{ticketData.price} ₽</span>
                  </div>
                </div>

                <p className="text-[10px] text-white/35 leading-tight max-w-xs mx-auto">
                  Сфотографируйте билет или покажите QR-код вашему кальянному мастеру. Мастер приготовит микс в точности с вашим рецептом.
                </p>

                {/* Sharing actions */}
                <div className="pt-2 space-y-2">
                  <a 
                    href={getTelegramShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-full bg-[#229ED9] hover:bg-[#1e8cb3] text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Отправить мастеру в Telegram
                  </a>

                  {isAuthenticated && (
                    <button 
                      onClick={handlePublishToFeed}
                      disabled={publishing}
                      className="w-full py-2.5 rounded-full border border-accent-gold/40 text-accent-gold hover:text-[#F4E4C4] hover:bg-accent-gold/15 flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-3.5 h-3.5" /> {publishing ? 'Публикация...' : 'Опубликовать в ленту'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
