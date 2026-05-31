import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, MessageSquare, Check, Flame, Gauge } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { HOOKAH_FLAVORS, FLAVOR_CATEGORIES } from '@/config/seats';
import { ThreeDNA } from '@/components/ThreeDNA';

const timeSlots = [
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00',
];

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<'table' | 'preorder'>('table');
  const [tableNumber, setTableNumber] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('19:00');
  const [guestsCount, setGuestsCount] = useState(2);
  const [phone, setPhone] = useState('');
  const [hookahMix, setHookahMix] = useState<string[]>([]);
  const [mixPercentages, setMixPercentages] = useState<Record<string, number>>({});
  const [hookahStrength, setHookahStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [hookahCount, setHookahCount] = useState(1);
  const [flavorCategory, setFlavorCategory] = useState('Все');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateMixFlavors = (name: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Войдите, чтобы оформить заказ', 'error');
      navigate('/login');
      return;
    }

    if (orderType === 'table' && !tableNumber) {
      showToast('Укажите номер стола', 'error');
      return;
    }

    if (hookahMix.length === 0) {
      showToast('Выберите хотя бы один вкус для кальяна', 'error');
      return;
    }

    setLoading(true);
    try {
      const finalSeatId = orderType === 'table' 
        ? `table-${tableNumber}-${Date.now()}` 
        : `preorder-${Date.now()}`;
      
      const finalSeatLabel = orderType === 'table'
        ? `Стол № ${tableNumber}`
        : `Предзаказ (${time})`;

      const finalSeatZone = orderType === 'table' ? 'hall' : 'vip';
      const finalDate = orderType === 'table' ? new Date().toISOString().slice(0, 10) : date;
      const finalTime = orderType === 'table' ? new Date().toTimeString().slice(0, 5) : time;
      const finalGuestsCount = orderType === 'table' ? 1 : guestsCount;

      await api.post('/api/bookings', {
        seatId: finalSeatId,
        seatLabel: finalSeatLabel,
        seatZone: finalSeatZone,
        date: finalDate,
        time: finalTime,
        guestsCount: finalGuestsCount,
        phone,
        hookahMix: hookahMix.map(name => `${name} (${mixPercentages[name] || 0}%)`).join(', '),
        hookahStrength,
        hookahCount,
        comment: comment || undefined,
      });
      
      setSuccess(true);
      showToast('Заказ оформлен! Кальянный мастер уже приступает.', 'success');
      setTableNumber('');
      setPhone('');
      setComment('');
      setHookahMix([]);
      setMixPercentages({});
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка при создании заказа', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-display font-bold gradient-text">Заказать кальян</h1>
        <p className="text-sm text-white/40 mt-1">Миксуйте премиальные вкусы под свои предпочтения</p>
      </motion.div>

      {/* Success state */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="p-6 text-center border-accent-gold/30">
              <div className="w-16 h-16 mx-auto rounded-full bg-accent-gold/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-accent-gold" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Заказ успешно отправлен!</h3>
              <p className="text-sm text-white/50">Кальянный мастер начнет готовить его прямо сейчас</p>
              <GlowButton className="mt-4" onClick={() => setSuccess(false)}>
                Заказать ещё один
              </GlowButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customizer Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Selector */}
            <GlassCard className="p-2 flex gap-2">
              <button
                onClick={() => setOrderType('table')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  orderType === 'table'
                    ? 'bg-gradient-to-r from-yellow-300 via-accent-gold to-yellow-500 text-black shadow-glow-gold-lg'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`}
              >
                💨 Я в заведении
              </button>
              <button
                onClick={() => setOrderType('preorder')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  orderType === 'preorder'
                    ? 'bg-gradient-to-r from-yellow-300 via-accent-gold to-yellow-500 text-black shadow-glow-gold-lg'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`}
              >
                📅 Предзаказ ко времени
              </button>
            </GlassCard>

            {/* Mixologist Section */}
            <GlassCard className="p-4 space-y-4">
              <label className="flex items-center gap-1.5 text-xs text-white/50 mb-0 font-medium">
                <Flame className="w-3.5 h-3.5 text-accent-gold" /> Соберите свой микс (Mixologist Pro v2)
              </label>

              {/* Category filter */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 border-b border-glass-border/10">
                {FLAVOR_CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setFlavorCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                      flavorCategory === cat
                        ? 'bg-accent-gold text-black border border-accent-gold/25'
                        : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}>{cat}</button>
                ))}
              </div>

              {/* Flavor grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[170px] overflow-y-auto scrollbar-hide pr-1 border-b border-glass-border/10 pb-3">
                {HOOKAH_FLAVORS
                  .filter(f => flavorCategory === 'Все' || f.category === flavorCategory)
                  .map(flavor => {
                    const selected = hookahMix.includes(flavor.name);
                    return (
                      <button key={flavor.name} type="button"
                        onClick={() => updateMixFlavors(flavor.name)}
                        className={`px-2.5 py-2 rounded-xl text-xs text-left transition-all flex items-center gap-1.5 ${
                          selected
                            ? 'bg-accent-gold/15 border border-accent-gold/45 text-accent-gold'
                            : 'bg-glass-bg border border-glass-border/60 text-white/60 hover:border-accent-gold/30 hover:text-white/80'
                        }`}>
                        <span className="text-sm">{flavor.emoji}</span>
                        <span className="truncate font-medium">{flavor.name}</span>
                        {selected && <span className="ml-auto text-accent-gold">✓</span>}
                      </button>
                    );
                })}
              </div>

              {/* Dynamic Taste DNA Visualizer */}
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
                    <div className="space-y-2">
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
          </div>

          {/* Form details panel */}
          <div>
            <GlassCard className="p-4 h-full flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dynamically shown details based on Tab */}
                {orderType === 'table' ? (
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5 font-medium">Номер стола</label>
                    <input
                      type="text"
                      placeholder="Например: 12"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="glass-input text-sm"
                      required
                    />
                    <p className="text-[10px] text-white/30 mt-1">Укажите номер стола, за которым вы находитесь в зале</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5" /> Дата
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="glass-input text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" /> Время
                        </label>
                        <select
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="glass-input text-sm"
                        >
                          {timeSlots.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                        <Users className="w-3.5 h-3.5" /> Количество гостей
                      </label>
                      <input
                        type="number"
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                        min={1}
                        max={20}
                        className="glass-input text-sm"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                      <Gauge className="w-3.5 h-3.5" /> Крепость
                    </label>
                    <select
                      value={hookahStrength}
                      onChange={(e) => setHookahStrength(e.target.value as 'light' | 'medium' | 'strong')}
                      className="glass-input text-sm"
                    >
                      <option value="light">Лёгкий</option>
                      <option value="medium">Средний</option>
                      <option value="strong">Крепкий</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                      💨 Кол-во
                    </label>
                    <input
                      type="number"
                      value={hookahCount}
                      onChange={(e) => setHookahCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                      min={1}
                      max={10}
                      className="glass-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5" /> Телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="glass-input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" /> Комментарий
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Пожелания, вкусовые акценты..."
                    className="glass-input text-sm min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>

                <GlowButton
                  type="submit"
                  size="lg"
                  className="w-full mt-4"
                  loading={loading}
                >
                  {orderType === 'table' 
                    ? (tableNumber ? `Заказать на стол № ${tableNumber}` : 'Укажите номер стола')
                    : `Оформить предзаказ`}
                </GlowButton>

                {!isAuthenticated && (
                  <p className="text-center text-xs text-white/30 mt-2">
                    Для заказа необходимо <a href="/login" className="text-accent-gold hover:underline">войти в аккаунт</a>
                  </p>
                )}
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
