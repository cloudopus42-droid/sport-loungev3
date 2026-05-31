import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, MessageSquare, Check, Crown, Flame, Gauge, Monitor, Gamepad2, Zap, Sparkles } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { ZONE_COLORS, ZONE_LABELS, HOOKAH_FLAVORS, FLAVOR_CATEGORIES } from '@/config/seats';
import type { Seat } from '@/types';
import { ThreeSeatingMap } from '@/components/ThreeSeatingMap';
import { ThreeDNA } from '@/components/ThreeDNA';

interface BookedSeat {
  seatId: string;
  time: string;
  status: string;
}

const timeSlots = [
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00',
];

const zoneIcons: Record<string, React.ReactNode> = {
  hall: <Monitor className="w-3.5 h-3.5" />,
  vip: <Crown className="w-3.5 h-3.5" />,
  ps: <Gamepad2 className="w-3.5 h-3.5" />,
  room: <Gamepad2 className="w-3.5 h-3.5" />,
  pro: <Zap className="w-3.5 h-3.5" />,
  oled: <Sparkles className="w-3.5 h-3.5" />,
};

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
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
  const [bookedSeats, setBookedSeats] = useState<BookedSeat[]>([]);
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

  // Fetch booked seats for selected date
  useEffect(() => {
    const fetchBooked = async () => {
      try {
        const { data } = await api.get<BookedSeat[]>(`/api/bookings/date/${date}`);
        setBookedSeats(data);
      } catch {}
    };
    fetchBooked();
  }, [date, success]);

  const isSeatBooked = (seatId: string) => {
    return bookedSeats.some(
      (b) => b.seatId === seatId && b.time === time
    );
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
      showToast('Войдите чтобы забронировать', 'error');
      navigate('/login');
      return;
    }

    if (!selectedSeat) {
      showToast('Выберите место на карте', 'error');
      return;
    }

      setLoading(true);
    try {
      await api.post('/api/bookings', {
        seatId: selectedSeat.id,
        seatLabel: selectedSeat.label,
        seatZone: selectedSeat.zone,
        date,
        time,
        guestsCount,
        phone,
        hookahMix: hookahMix.map(name => `${name} (${mixPercentages[name] || 0}%)`).join(', '),
        hookahStrength,
        hookahCount,
        comment: comment || undefined,
      });
      setSuccess(true);
      showToast('Заказ оформлен! Ожидайте подтверждения.', 'success');
      setSelectedSeat(null);
      setPhone('');
      setComment('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка бронирования', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-display font-bold gradient-text">Оформить заказ</h1>
        <p className="text-xs text-white/40 mt-1">Выберите место, кальян и время</p>
      </motion.div>

      {/* Success state */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="p-6 text-center border-green-500/30">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Бронь отправлена!</h3>
              <p className="text-sm text-white/50">Мы свяжемся с вами для подтверждения</p>
              <GlowButton className="mt-4" onClick={() => setSuccess(false)}>
                Забронировать ещё
              </GlowButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <>
          {/* Date & Time Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-4 space-y-4">
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
            </GlassCard>
          </motion.div>

          {/* Seating Map */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-4">
              <h3 className="text-sm font-display font-semibold text-white mb-3">Карта зала</h3>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(ZONE_LABELS).map(([zone, label]) => (
                  <div key={zone} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: ZONE_COLORS[zone as keyof typeof ZONE_COLORS].bg,
                        border: `1px solid ${ZONE_COLORS[zone as keyof typeof ZONE_COLORS].border}`,
                      }}
                    />
                    <span className="text-white/50">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                  <span className="text-white/50">Занято</span>
                </div>
              </div>

              {/* 3D WebGL Digital Twin Map */}
              <ThreeSeatingMap
                selectedSeat={selectedSeat}
                setSelectedSeat={setSelectedSeat}
                isSeatBooked={isSeatBooked}
              />

              {/* Selected seat info */}
              <AnimatePresence>
                {selectedSeat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 px-3 py-2 rounded-xl border border-glass-border bg-glass-bg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {zoneIcons[selectedSeat.zone]}
                        <span className="text-sm font-medium text-white">{selectedSeat.label}</span>
                        <span className="text-xs text-white/40">
                          {ZONE_LABELS[selectedSeat.zone]} • до {selectedSeat.capacity} гостей
                        </span>
                      </div>
                      <button onClick={() => setSelectedSeat(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                      <Users className="w-3.5 h-3.5" /> Гостей
                    </label>
                    <input
                      type="number"
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Math.max(1, Math.min(selectedSeat?.capacity || 20, Number(e.target.value))))}
                      min={1}
                      max={selectedSeat?.capacity || 20}
                      className="glass-input text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5" /> Телефон
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 999 123-45-67"
                      className="glass-input text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-1.5 text-xs text-white/50 mb-0 font-medium">
                    <Flame className="w-3.5 h-3.5 text-accent-gold" /> Выберите микс (Mixologist Pro v2)
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[150px] overflow-y-auto scrollbar-hide pr-1 border-b border-glass-border/10 pb-3">
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

                  {/* Dynamic Visual Mixer Flask & Characteristic Meters */}
                  {hookahMix.length > 0 && (
                    <motion.div 
                      className="space-y-4 bg-white/5 p-4 rounded-2xl border border-glass-border/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* 3D Taste DNAs Carousel (Full Width) */}
                      <ThreeDNA 
                        mix={hookahMix}
                        mixPercentages={mixPercentages}
                        activeCategory={flavorCategory}
                        onSelectCategory={setFlavorCategory}
                      />

                      {/* Meters & Sliders Grid */}
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

                        {/* Percentage sliders */}
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

                </div>

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
                      💨 Количество кальянов
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
                    <MessageSquare className="w-3.5 h-3.5" /> Комментарий
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Пожелания к заказу..."
                    className="glass-input text-sm min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>

                <GlowButton
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loading}
                  disabled={!selectedSeat}
                >
                  {!selectedSeat ? 'Выберите место на карте' : `Оформить заказ • ${selectedSeat.label}`}
                </GlowButton>

                {!isAuthenticated && (
                  <p className="text-center text-xs text-white/30">
                    Для бронирования необходимо <a href="/login" className="text-accent-cyan hover:underline">войти</a>
                  </p>
                )}
              </form>
            </GlassCard>
          </motion.div>
        </>
      )}
    </div>
  );
}
