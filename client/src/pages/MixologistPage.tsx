import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, X, Share2, Send, Bookmark, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { ThreeDNA } from '@/components/ThreeDNA';
import { HOOKAH_FLAVORS, FLAVOR_CATEGORIES } from '@/config/seats';

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

export function MixologistPage() {
  const { user } = useAuth();

  // Mix States
  const [hookahMix, setHookahMix] = useState<string[]>([]);
  const [mixPercentages, setMixPercentages] = useState<Record<string, number>>({});
  const [hookahStrength, setHookahStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [bowlType, setBowlType] = useState('clay');
  const [liquidBase, setLiquidBase] = useState('water');
  const [flavorCategory, setFlavorCategory] = useState('Все');
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  // Submission States
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

  // Save Mix to local storage so it can be selected inside BookingPage
  const handleSaveToLocal = () => {
    if (hookahMix.length === 0) {
      showToast('Добавьте хотя бы один вкус в микс', 'error');
      return;
    }
    const mixData = {
      bowlType,
      liquidBase,
      hookahStrength,
      hookahMix,
      mixPercentages,
      comment
    };
    try {
      localStorage.setItem('my_saved_mix', JSON.stringify(mixData));
      showToast('Микс сохранен! Вы можете импортировать его на странице бронирования.', 'success');
    } catch (e) {
      showToast('Не удалось сохранить рецепт', 'error');
    }
  };

  // Generate QR/Ticket by calling backend public-mix endpoint
  const handleGenerateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hookahMix.length === 0) {
      showToast('Сначала настройте кальянный микс', 'error');
      return;
    }
    if (!phone || phone.trim().length < 5) {
      showToast('Укажите контактный телефон для создания билета', 'error');
      return;
    }

    setLoading(true);
    try {
      const mixString = hookahMix.map(name => `${name} (${mixPercentages[name] || 0}%)`).join(', ');
      const strengthLabel = hookahStrength === 'light' ? 'Лёгкий' : hookahStrength === 'medium' ? 'Средний' : 'Крепкий';
      const ticketId = `MIX-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

      await api.post('/api/bookings/public-mix', {
        bowl: selectedBowl.name,
        base: selectedBase.name,
        strength: strengthLabel,
        mix: mixString,
        price: totalPrice,
        phone: phone,
        comment: comment || 'Без комментариев',
        ticketId,
        userName: user?.name || 'Гость системы',
      });

      setTicketData({
        ticketId,
        bowl: selectedBowl.name,
        base: selectedBase.name,
        strength: strengthLabel,
        mix: mixString,
        price: totalPrice,
        comment: comment || 'Без комментариев'
      });
      setShowTicket(true);
      showToast('Билет-рецепт успешно создан! Предъявите его кальянщику.', 'success');

      // Save to quick import pref too
      localStorage.setItem('prefilled_mix', JSON.stringify({
        bowlType,
        liquidBase,
        hookahStrength,
        hookahMix,
        mixPercentages,
        comment
      }));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка при генерации билета', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Publish mix to Feed
  const handlePublishToFeed = async () => {
    if (hookahMix.length === 0) {
      showToast('Сначала соберите микс', 'error');
      return;
    }
    setPublishing(true);
    try {
      const mixString = hookahMix.map(name => `${name} (${mixPercentages[name] || 0}%)`).join(', ');
      const strengthLabel = hookahStrength === 'light' ? 'Лёгкий' : hookahStrength === 'medium' ? 'Средний' : 'Крепкий';
      const tempId = `RECIPE-${Math.floor(100 + Math.random() * 900)}`;

      const response = await fetch('/icon-512.png');
      const blob = await response.blob();
      const imageFile = new File([blob], 'recipe-hookah.png', { type: 'image/png' });

      const fd = new FormData();
      fd.append('title', `Авторский микс: ${user?.name || 'Гость'}`);
      fd.append('description', `Рецепт ${tempId}\n🏺 Чаша: ${selectedBowl.name}\n💧 База: ${selectedBase.name}\n⚡ Крепость: ${strengthLabel}\n🍓 Микс: ${mixString}\n"${comment || 'Отличный покур!'}"`);
      fd.append('image', imageFile);

      await api.post('/api/posts', fd);
      showToast('Ваш рецепт опубликован в ленту сообщества!', 'success');
    } catch (err) {
      showToast('Не удалось опубликовать рецепт в ленту', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center select-none">
        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold font-bold flex items-center justify-center gap-1.5 mb-1.5">
          <Flame className="w-4 h-4 text-accent-gold animate-pulse" /> ИИ-МИКСОЛОГ
        </span>
        <h1 className="text-3xl font-display font-light text-white uppercase tracking-wider">
          Конструктор <span className="gradient-text font-semibold italic">Вкусовых</span> Рецептов
        </h1>
        <p className="text-xs text-white/50 mt-1 font-light max-w-lg mx-auto leading-relaxed">
          Создавайте авторские вкусовые сочетания в реальном времени с 3D-моделированием. Сгенерируйте билет для кальянщика или сохраните его для бронирования стола.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Flavors and Sliders */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-glass-border/10 pb-2">
              <h3 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent-gold" /> Выберите вкусы табака (до 4 видов)
              </h3>
              <span className="text-[10px] text-accent-cyan font-bold font-mono">ВЫБРАНО: {hookahMix.length}/4</span>
            </div>

            {/* Categories */}
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

            {/* Flavors Grid */}
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

            {/* 3D DNA and Characteristics */}
            {hookahMix.length > 0 && (
              <motion.div 
                className="space-y-4 bg-white/5 p-4 rounded-2xl border border-glass-border/30"
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
        </div>

        {/* Right Side: Bowls, Bases, and Checkout */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-5 space-y-4">
            <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5 border-b border-glass-border/10 pb-2 mb-0">
              🏺 Тип чаши
            </h4>
            <div className="space-y-2">
              {BOWL_TYPES.map(b => (
                <div key={b.id} 
                  onClick={() => { triggerHaptic(20); setBowlType(b.id); }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    bowlType === b.id 
                      ? 'bg-accent-gold/10 border-accent-gold text-white' 
                      : 'bg-glass-bg border-glass-border/60 hover:border-accent-gold/30 text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold">{b.name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-gold">
                    {b.id === 'clay' ? 'Вкл' : `+${b.price - 1200}₽`}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5 border-b border-glass-border/10 pb-2 mb-0 pt-2">
              💧 Жидкость колбы
            </h4>
            <div className="space-y-2">
              {LIQUID_BASES.map(l => (
                <div key={l.id} 
                  onClick={() => { triggerHaptic(20); setLiquidBase(l.id); }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    liquidBase === l.id 
                      ? 'bg-accent-gold/10 border-accent-gold text-white' 
                      : 'bg-glass-bg border-glass-border/60 hover:border-accent-gold/30 text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{l.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold">{l.name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-gold">
                    {l.price === 0 ? 'Вкл' : `+${l.price}₽`}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions (Save locally, Publish to Feed) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-glass-border/10">
              <button
                type="button"
                onClick={handleSaveToLocal}
                className="py-2.5 rounded-xl border border-glass-border/60 hover:border-accent-gold text-white/70 hover:text-accent-gold text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-white/5"
              >
                <Bookmark className="w-3.5 h-3.5" /> В профиль
              </button>
              <button
                type="button"
                onClick={handlePublishToFeed}
                disabled={publishing}
                className="py-2.5 rounded-xl border border-glass-border/60 hover:border-accent-gold text-white/70 hover:text-accent-gold text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-white/5"
              >
                <Share2 className="w-3.5 h-3.5" /> В ленту
              </button>
            </div>
          </GlassCard>

          {/* Ticket generation form */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-semibold border-b border-glass-border/10 pb-2 mb-0">
              🎫 Сгенерировать Билет
            </h3>
            
            <form onSubmit={handleGenerateTicket} className="space-y-3">
              <div>
                <label className="text-[10px] text-white/40 block mb-1 font-medium">Желаемая крепость</label>
                <select
                  value={hookahStrength}
                  onChange={(e) => setHookahStrength(e.target.value as any)}
                  className="glass-input text-xs !py-2"
                >
                  <option value="light">Лёгкий (Light)</option>
                  <option value="medium">Средний (Medium)</option>
                  <option value="strong">Крепкий (Strong)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/40 block mb-1 font-medium">Мобильный телефон</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="glass-input text-xs !py-2"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 block mb-1 font-medium">Комментарий к заказу (пожелания)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Мягкая забивка, холоднее..."
                  className="glass-input text-xs !py-2 min-h-[50px] resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-white pt-1">
                <span>Итого к оплате в клубе:</span>
                <span className="text-sm text-accent-gold">{totalPrice} ₽</span>
              </div>

              <GlowButton type="submit" className="w-full text-xs font-bold py-2.5 uppercase" loading={loading}>
                Получить рецепт-билет
              </GlowButton>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {showTicket && ticketData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-sm w-full bg-gradient-to-b from-[#1c1814] to-black rounded-3xl border border-accent-gold/25 p-6 shadow-2xl"
            >
              <button 
                onClick={() => setShowTicket(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="text-center space-y-4 pt-2 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-accent-gold/45" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent-gold/45" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-accent-gold/45" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent-gold/45" />

                <Flame className="w-6 h-6 text-accent-gold mx-auto animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-accent-gold font-bold block mb-1">Рецепт-Билет заказа</span>
                
                <h3 className="text-lg font-display font-light text-white uppercase tracking-wider">
                  SPORT LOUNGE <br />
                  <span className="gradient-text font-semibold font-mono text-sm">{ticketData.ticketId}</span>
                </h3>

                {/* QR Code Graphic Mock */}
                <div className="my-4 w-40 h-40 bg-white p-2.5 rounded-2xl mx-auto shadow-inner border border-accent-gold/25 flex items-center justify-center relative overflow-hidden group">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(ticketData))}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/5 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="space-y-1.5 text-left bg-white/5 p-4 rounded-xl border border-glass-border/30 text-xs">
                  <div className="flex justify-between text-white/50">
                    <span>Сборка:</span>
                    <span className="text-white font-bold">{ticketData.mix}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Чаша:</span>
                    <span className="text-white font-semibold">{ticketData.bowl}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>База колбы:</span>
                    <span className="text-white font-semibold">{ticketData.base}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Крепость:</span>
                    <span className="text-accent-gold font-semibold">{ticketData.strength}</span>
                  </div>
                  <div className="h-px bg-glass-border/10 my-1" />
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-1">
                    <span>Итого к оплате:</span>
                    <span className="text-accent-gold text-base">{ticketData.price} ₽</span>
                  </div>
                </div>

                <p className="text-[9px] text-white/40 max-w-xs mx-auto leading-relaxed pl-1.5 flex gap-1 items-start text-left">
                  <Info className="w-3.5 h-3.5 text-accent-gold flex-shrink-0 mt-0.5" />
                  <span>Покажите QR-код кальянному мастеру. Заказ будет внесен в систему и подготовлен сразу же!</span>
                </p>

                <div className="flex gap-2 pt-2 select-none">
                  <a 
                    href={`https://t.me/NHSC_founder?text=${encodeURIComponent(`💨 *НОВЫЙ РЕЦЕПТ-БИЛЕТ SPORT LOUNGE*\n\n🎫 Билет: *${ticketData.ticketId}*\n🏺 Чаша: *${ticketData.bowl}*\n💧 База: *${ticketData.base}*\n⚡ Крепость: *${ticketData.strength}*\n🍓 Смесь: *${ticketData.mix}*\n💳 Сумма: *${ticketData.price} руб*`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-gradient-to-r from-accent-gold/10 to-amber-500/10 border border-accent-gold/30 hover:border-accent-gold/60 text-accent-gold text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> В Telegram
                  </a>
                  <button 
                    onClick={() => setShowTicket(false)}
                    className="flex-1 py-2 bg-white/5 border border-glass-border/40 hover:bg-white/10 hover:border-glass-border/80 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
