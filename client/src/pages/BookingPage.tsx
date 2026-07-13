import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Clock, Sparkles,
  Bot, ThumbsUp, ShoppingCart, ChevronRight,
  Leaf, Zap, Bookmark, Trash2, Flame, Timer, Sun, Moon, Sunrise
} from 'lucide-react';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { showToast } from '@/components/NotificationToast';
import { SmokeEffect } from '@/components/ui/SmokeEffect';
import { TabSwitcher } from '@/components/ui/TabSwitcher';

type Flavor = {
  id: string;
  name: string;
  category: string;
  emoji?: string;
  color?: string;
  is_active: boolean;
  price_value?: number;
  strength?: number;
};

const bookingFormSchema = z.object({
  specialNotes: z.string().max(500, 'Максимум 500 символов').optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const AI_MOODS = [
  { id: 'sweet', label: 'Сладкий', icon: 'honey', desc: 'Фруктовые и десертные ноты' },
  { id: 'strong', label: 'Крепкий', icon: 'muscle', desc: 'Насыщенный дым и крепость' },
  { id: 'fresh', label: 'Свежий', icon: 'leaf', desc: 'Мятные и цитрусовые оттенки' },
  { id: 'berry', label: 'Ягодный', icon: 'berry', desc: 'Лесные и садовые ягоды' },
  { id: 'exotic', label: 'Экзотика', icon: 'palm', desc: 'Тропические сочетания' },
  { id: 'classic', label: 'Классика', icon: 'trophy', desc: 'Проверенные временем вкусы' },
];

type TimePeriod = 'asap' | 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';
const TIME_PERIODS: { id: TimePeriod; label: string; icon: typeof Sun; desc: string; hours?: string }[] = [
  { id: 'asap', label: 'Как можно скорее', icon: Zap, desc: '~15 мин' },
  { id: 'morning', label: 'Утро', icon: Sunrise, desc: '08:00–12:00', hours: '09:00' },
  { id: 'afternoon', label: 'День', icon: Sun, desc: '12:00–17:00', hours: '14:00' },
  { id: 'evening', label: 'Вечер', icon: Flame, desc: '17:00–22:00', hours: '19:00' },
  { id: 'night', label: 'Ночь', icon: Moon, desc: '22:00–08:00', hours: '23:00' },
  { id: 'custom', label: 'Выбрать время', icon: Timer, desc: 'Точное время' },
];

type OrderTab = 'order' | 'mixologist';

const stages = [
  { id: 'accepted', label: 'Принят', desc: 'Заказ зарегистрирован' },
  { id: 'preparing', label: 'Подготовка', desc: 'Сборка микса и забивка чаши' },
  { id: 'roasting', label: 'Прогрев', desc: 'Разогрев углей' },
  { id: 'delivering', label: 'Подача', desc: 'Вынос кальяна к столу' },
  { id: 'done', label: 'Подан', desc: 'Кальян готов, приятного покура!' },
];

export function BookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [selectedMix, setSelectedMix] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [flavorCategory, setFlavorCategory] = useState('Все');
  const [aiMood, setAiMood] = useState<string[]>([]);
  const [strength, setStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [masterCalled, setMasterCalled] = useState(false);
  const [timeText, setTimeText] = useState('15:00');
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [savingMix, setSavingMix] = useState(false);
  const [mixSaved, setMixSaved] = useState(false);
  const [userMixes, setUserMixes] = useState<any[]>([]);
  const [showSavedMixes, setShowSavedMixes] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>('order');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('asap');

  const flavorCategories = useMemo(() => {
    const cats = new Set(flavors.map(f => f.category).filter(Boolean));
    return ['Все', ...Array.from(cats).sort()];
  }, [flavors]);
  const [customTime, setCustomTime] = useState('19:00');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchOrderStatusRef = useRef<AbortController | null>(null);

  // AI Mixologist extra settings
  const [aiStrength, setAiStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [aiDeliveryTime, setAiDeliveryTime] = useState('Сейчас');

  const aiRecommendations = useMemo(() => {
    if (aiMood.length === 0) return [];
    const moodFlavorMap: Record<string, string[]> = {
      sweet: ['Манго-Маракуйя', 'Персик-Лайм', 'Клубника-Мята', 'Банан-Шоколад', 'Кокос-Ваниль'],
      strong: ['Двойное яблоко', 'Sport Mix (авторский)', 'Грейпфрут-Мята', 'Lounge Premium'],
      fresh: ['Мята-Айс', 'Ледяной грейпфрут', 'Кактус-Фрост', 'Грейпфрут-Мята', 'Лимон-Имбирь'],
      berry: ['Клубника-Мята', 'Черника-Ежевика', 'Малина-Личи', 'Виноград-Ягоды'],
      exotic: ['Манго-Маракуйя', 'Кактус-Фрост', 'Арбуз-Дыня', 'Кокос-Ваниль'],
      classic: ['Двойное яблоко', 'Мята-Айс', 'Виноград-Ягоды', 'Lounge Premium'],
    };
    return [...new Set(aiMood.flatMap(m => moodFlavorMap[m] || []))].slice(0, 6);
  }, [aiMood]);

  const location = useLocation();

  const switchTab = useCallback((tab: OrderTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '') as OrderTab;
    if (hash === 'mixologist' || hash === 'order') {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    if (location.state?.savedMix) {
      const mix = location.state.savedMix;
      setSelectedMix({
        id: 'custom-saved',
        name: mix.name,
        description: Array.isArray(mix.flavors) ? mix.flavors.join(', ') : '',
        strength: mix.strength === 'light' ? 3 : mix.strength === 'strong' ? 9 : 6,
        isCustom: true,
        raw: { hookahMix: Array.isArray(mix.flavors) ? mix.flavors : [], mixPercentages: {}, fromSavedMix: true },
      });
      setShowConfirmModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { register, handleSubmit, reset } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { specialNotes: '' },
  });

  const getPreferredTimeLabel = (): string => {
    if (timePeriod === 'asap') return 'Сейчас';
    if (timePeriod === 'custom') return customTime;
    return TIME_PERIODS.find(p => p.id === timePeriod)?.hours || 'Сейчас';
  };

  const fetchOrderStatus = (id: string) => {
    fetchOrderStatusRef.current?.abort();
    const ac = new AbortController();
    fetchOrderStatusRef.current = ac;
    api(`/api/orders/${id}/status`, { signal: ac.signal })
      .then(data => { if (!ac.signal.aborted) setActiveOrder(data); })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        localStorage.removeItem('current_order_id');
        setActiveOrder(null);
      });
  };

  useEffect(() => {
    const ac = new AbortController();
    api<Flavor[]>('/api/flavors', { signal: ac.signal })
      .then((data) => {
        if (data?.length) {
          const active = data.filter(f => f.is_active !== false);
          setFlavors(active);
        }
      })
      .catch(() => {});
    if (isAuthenticated) {
      api<any[]>('/api/mixes/user-mixes', { signal: ac.signal })
        .then(data => { if (data?.length) setUserMixes(data); })
        .catch(() => {});
    }
    return () => { ac.abort(); };
  }, [isAuthenticated]);

  useEffect(() => {
    const savedOrderId = localStorage.getItem('current_order_id');
    if (savedOrderId && isAuthenticated) fetchOrderStatus(savedOrderId);
    return () => { fetchOrderStatusRef.current?.abort(); };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:updated', (data: any) => {
      const savedId = localStorage.getItem('current_order_id');
      if (data?.id === savedId) {
        setActiveOrder(data);
        if (data.status === 'done') showToast('Ваш кальян готов! Приятного покура! 💨', 'success');
      }
    });
    return () => { socket.off('order:updated'); };
  }, [socket]);

  useEffect(() => {
    if (!activeOrder) { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); return; }
    const tick = () => {
      const diff = new Date(activeOrder.promisedDeliveryTime).getTime() - Date.now();
      if (activeOrder.status === 'done') { setTimeText('ГОТОВ'); if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); return; }
      if (diff <= 0) { setTimeText('СКОРО БУДЕТ'); return; }
      const m = Math.floor(diff / 1000 / 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeText(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    const pollInterval = setInterval(() => fetchOrderStatus(activeOrder.id), 8000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); clearInterval(pollInterval); };
  }, [activeOrder]);

  const toggleFlavor = (name: string) => {
    setSelectedFlavors(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name].slice(0, 4));
  };

  const onOrderSubmit = async (data: BookingFormValues) => {
    if (selectedFlavors.length === 0) {
      showToast('Выберите хотя бы один вкус', 'error');
      return;
    }
    if (!selectedMix) return;
    setLoading(true);
    try {
      const isCustom = selectedMix.isCustom;
      let finalNotes = data.specialNotes || '';
      if (isCustom && selectedMix.raw && selectedMix.raw.hookahMix?.length > 0) {
        const raw = selectedMix.raw;
        const hasPercentages = Object.keys(raw.mixPercentages || {}).length > 0;
        const prefix = raw.fromSavedMix ? 'Сохранённый рецепт' : 'ИИ-Микс';
        if (hasPercentages) {
          finalNotes = `[${prefix}: ${raw.hookahMix.map((n: string) => `${n} (${raw.mixPercentages[n]}%)`).join(', ')}] ${finalNotes}`;
        } else {
          finalNotes = `[${prefix}: ${raw.hookahMix.join(', ')}] ${finalNotes}`;
        }
      }
      const orderStrength = selectedMix.strength === 3 ? 'light' : selectedMix.strength === 9 ? 'strong' : 'medium';
      const timeLabel = getPreferredTimeLabel();
      finalNotes = `[S:${orderStrength}][Время:${timeLabel}]${finalNotes ? ' ' + finalNotes : ''}`;
      const res = await api('/api/orders', { method: 'POST', body: {
        mix_id: isCustom ? null : selectedMix.id, notes: finalNotes,
        strength: orderStrength,
        hookah_mix: selectedMix.description || '',
      }});
      setActiveOrder(res);
      localStorage.setItem('current_order_id', res.id);
      setShowConfirmModal(false);
      setShowOrderTracker(true);
      reset();
      showToast('Заказ успешно принят!', 'success');
    } catch (err) { showToast('Не удалось оформить заказ', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteUserMix = async (id: string) => {
    try {
      await api(`/api/mixes/user-mixes/${id}`, { method: 'DELETE' });
      setUserMixes(prev => prev.filter(m => m.id !== id));
      showToast('Рецепт удалён', 'success');
    } catch { showToast('Ошибка удаления', 'error'); }
  };

  const handleOrderSavedMix = (mix: any) => {
    const flavors = Array.isArray(mix.flavors) ? mix.flavors : [];
    setSelectedMix({
      id: 'custom-saved',
      name: mix.name,
      description: flavors.join(', '),
      strength: mix.strength === 'light' ? 3 : mix.strength === 'strong' ? 9 : 6,
      isCustom: true,
      raw: { hookahMix: flavors, mixPercentages: {}, fromSavedMix: true },
    });
    setShowConfirmModal(true);
  };

  const handleCallMaster = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try { await api(`/api/orders/${activeOrder.id}/request-master`, { method: 'POST' }); setMasterCalled(true); showToast('Мастер вызван к вашему столу', 'success'); }
    catch (err) { showToast('Ошибка вызова мастера', 'error'); }
    finally { setLoading(false); }
  };

  const handleSaveMix = async () => {
    if (!isAuthenticated) { showToast('Авторизуйтесь для сохранения', 'error'); navigate('/login?redirect=/order'); return; }
    if (selectedFlavors.length === 0 && aiRecommendations.length === 0) { showToast('Выберите хотя бы один вкус', 'error'); return; }
    setSavingMix(true);
    try {
      const flavors = selectedFlavors.length > 0 ? selectedFlavors : aiRecommendations.slice(0, 3);
      await api('/api/mixes/user-mixes', { method: 'POST', body: {
        name: `Микс: ${flavors.join(', ')}`,
        flavors,
        percentages: {},
        strength: aiStrength,
        notes: `Крепость: ${aiStrength}, Подача: ${aiDeliveryTime}`,
      }});
      const data = await api<any[]>('/api/mixes/user-mixes');
      if (data?.length) setUserMixes(data);
      setMixSaved(true);
      showToast('Рецепт сохранён в профиль!', 'success');
    } catch (err: any) { showToast(err?.error || 'Ошибка сохранения', 'error'); }
    finally { setSavingMix(false); }
  };

  const handleQuickOrder = () => {
    if (!isAuthenticated) { showToast('Авторизуйтесь для оформления заказа', 'error'); navigate('/login?redirect=/order'); return; }
    if (selectedFlavors.length === 0) {
      showToast('Выберите хотя бы один вкус', 'error');
      return;
    }
    setSelectedMix({
      id: 'custom-quick',
      name: selectedFlavors.length > 0 ? `Микс: ${selectedFlavors.join(', ')}` : 'Авторский микс',
      description: selectedFlavors.length > 0 ? `Вкусы: ${selectedFlavors.join(', ')}` : 'Соберите свой идеальный вкус',
      strength: strength === 'light' ? 3 : strength === 'medium' ? 6 : 9,
      isCustom: true,
    });
    setShowConfirmModal(true);
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-hidden">
      <SmokeEffect />
      <div className="fixed top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-accent-gold opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#8D6B3D] opacity-[0.02] blur-[130px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5 pb-24">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-gold/20 bg-accent-gold/5 text-[11px] font-semibold text-accent-gold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3 h-3" /> Premium Hookah Experience
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-1 font-heading">
            Заказ & <span className="text-accent-gold">ИИ-Миксолог</span>
          </h1>
          <p className="text-white/40 text-xs max-w-md mx-auto lg:mx-0">
            Соберите идеальный кальян или доверьтесь рекомендациям ИИ — всё на одной странице
          </p>
        </div>

        <TabSwitcher<OrderTab>
          tabs={[
            { id: 'order', label: 'Параметры заказа', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
            { id: 'mixologist', label: 'ИИ-Миксолог', icon: <Bot className="w-3.5 h-3.5" /> },
          ]}
          active={activeTab}
          onSelect={switchTab}
        />

        <AnimatePresence mode="wait">
          {activeTab === 'order' ? (
            <motion.div
              key="order-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-5"
            >
              {/* Flavors */}
              <div className="liquid-glass bg-liquid-glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-3.5 h-3.5 text-accent-gold" />
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Вкусы (до 4)</h3>
                  <span className="ml-auto text-[11px] text-white/30">{selectedFlavors.length}/4</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide mb-2">
                  {flavorCategories.map(cat => (
                    <button key={cat} onClick={() => setFlavorCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${
                        flavorCategory === cat
                          ? 'bg-accent-gold text-[#0b0807] border-accent-gold/30'
                          : 'text-white/40 bg-white/5 border-transparent hover:border-accent-gold/20'
                      }`}>{cat}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
                  {flavors.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-white/30 text-xs">
                      Вкусы пока не добавлены
                    </div>
                  ) : flavors
                    .filter(f => flavorCategory === 'Все' || f.category === flavorCategory)
                    .map(flavor => {
                      const sel = selectedFlavors.includes(flavor.name);
                      return (
                        <motion.button key={flavor.name} whileTap={{ scale: 0.96 }}
                          onClick={() => toggleFlavor(flavor.name)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                            sel
                              ? 'bg-[rgba(255,191,0,0.08)] border-[rgba(255,191,0,0.25)] text-accent-gold'
                              : 'bg-white/[0.02] border-transparent text-white/40 hover:border-[rgba(255,191,0,0.12)]'
                          }`}
                        >
                          <span className="text-base leading-none">{flavor.emoji || '🍂'}</span>
                          <span className="truncate">{flavor.name}</span>
                        </motion.button>
                      );
                    })}
                </div>
              </div>

              {/* Strength */}
              <div className="liquid-glass bg-liquid-glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-accent-gold" />
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Крепость</h3>
                </div>
                <div className="flex gap-2">
                  {([
                    { id: 'light' as const, label: 'Лёгкая', hint: 'Мягкий вкус', icon: 'dove' },
                    { id: 'medium' as const, label: 'Средняя', hint: 'Золотая середина', icon: 'scale' },
                    { id: 'strong' as const, label: 'Крепкая', hint: 'Насыщенный пар', icon: 'muscle' },
                  ]).map(s => (
                    <button key={s.id} type="button" onClick={() => setStrength(s.id)}
                      className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-all border ${
                        strength === s.id
                          ? s.id === 'light' ? 'bg-[rgba(76,175,80,0.1)] border-[rgba(76,175,80,0.3)] text-[#4CAF50]'
                            : s.id === 'medium' ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-accent-gold'
                            : 'bg-[rgba(244,67,54,0.1)] border-[rgba(244,67,54,0.3)] text-[#F44336]'
                          : 'bg-white/[0.02] border-transparent text-white/30 hover:border-white/10'
                      }`}
                    >
                      <PremiumIcon name={s.icon} size={18} className="mb-0.5" />
                      <span>{s.label}</span>
                      <span className={`${strength === s.id ? 'opacity-70' : 'opacity-0'} text-[11px] leading-none mt-0.5 hidden sm:inline`}>{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Time */}
              <div className="liquid-glass bg-liquid-glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-3.5 h-3.5 text-accent-gold" />
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Время подачи</h3>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {TIME_PERIODS.map(period => {
                    const Icon = period.icon;
                    const sel = timePeriod === period.id;
                    return (
                      <button key={period.id} type="button" onClick={() => setTimePeriod(period.id)}
                        className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-[11px] font-semibold transition-all border ${
                          sel
                            ? 'bg-[rgba(255,191,0,0.08)] border-[rgba(255,191,0,0.25)] text-accent-gold'
                            : 'bg-white/[0.02] border-transparent text-white/30 hover:border-white/10'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${sel ? 'text-accent-gold' : 'text-white/20'}`} />
                        <span>{period.label}</span>
                        <span className={`text-[10px] mt-0.5 ${sel ? 'text-accent-gold/60' : 'text-white/15'}`}>{period.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {timePeriod === 'custom' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-gold focus:outline-none transition-colors [color-scheme:dark]"
                      />
                      <span className="text-[11px] text-white/30">точное время</span>
                    </div>
                  </motion.div>
                )}
                {timePeriod !== 'asap' && timePeriod !== 'custom' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <input
                      type="time"
                      value={TIME_PERIODS.find(p => p.id === timePeriod)?.hours || '19:00'}
                      onChange={(e) => {
                        const period = TIME_PERIODS.find(p => p.id === timePeriod);
                        if (period) period.hours = e.target.value;
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-gold focus:outline-none transition-colors [color-scheme:dark]"
                    />
                    <span className="text-[11px] text-white/30">точное время</span>
                  </div>
                )}
              </div>

              {/* Order Button */}
              <motion.button
                whileHover={{ scale: selectedFlavors.length === 0 ? 1 : 1.01 }}
                whileTap={{ scale: selectedFlavors.length === 0 ? 1 : 0.98 }}
                onClick={handleQuickOrder}
                disabled={selectedFlavors.length === 0}
                className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedFlavors.length === 0
                    ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-[#FFBF00] to-[#FFD54F] text-black shadow-[0_4px_20px_rgba(255,191,0,0.25),0_0_40px_rgba(255,191,0,0.1)] hover:shadow-[0_4px_28px_rgba(255,191,0,0.35),0_0_50px_rgba(255,191,0,0.15)]'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {selectedFlavors.length === 0 ? 'Выберите вкус' : 'Заказать'}
              </motion.button>

              {/* Active Order Tracker */}
              {activeOrder && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="liquid-glass bg-liquid-glass rounded-2xl p-4 border border-[rgba(255,191,0,0.08)]"
                >
                  <button onClick={() => setShowOrderTracker(!showOrderTracker)}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent-gold" />
                      <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Статус заказа</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-accent-gold">{timeText}</span>
                      <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${showOrderTracker ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  {showOrderTracker && (
                    <div className="space-y-3 pl-3 relative">
                      <div className="absolute left-[18px] top-8 bottom-4 w-px bg-gradient-to-b from-[#FFBF00] to-white/5" />
                      {stages.map((stage, idx) => {
                        const stagesList = stages.map(s => s.id);
                        const currentIdx = stagesList.indexOf(activeOrder.status);
                        const isCompleted = currentIdx > idx;
                        const isActive = currentIdx === idx;
                        return (
                          <div key={stage.id} className={`flex items-start gap-3 relative ${isCompleted || isActive ? 'opacity-100' : 'opacity-20'}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center z-10 ${
                              isActive ? 'border-accent-gold text-accent-gold' : isCompleted ? 'border-accent-gold text-accent-gold' : 'border-white/10 text-white/20'
                            }`}>
                              {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-accent-gold' : 'bg-transparent'}`} />}
                            </div>
                            <div className="pt-0.5">
                              <h5 className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-accent-gold' : 'text-white'}`}>{stage.label}</h5>
                              <p className="text-[11px] text-white/30">{stage.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={handleCallMaster} disabled={masterCalled}
                        className="mt-3 w-full py-2.5 rounded-xl border border-[rgba(255,191,0,0.2)] bg-[rgba(255,191,0,0.04)] hover:bg-[rgba(255,191,0,0.1)] disabled:bg-white/5 disabled:border-white/10 text-[11px] font-bold text-accent-gold disabled:text-white/20 uppercase tracking-[0.12em] transition-all"
                      >
                        {masterCalled ? 'Вызов отправлен' : 'Позвать мастера'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="mixologist-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-5"
            >
              <div className={`liquid-glass bg-liquid-glass rounded-2xl p-4 border ${aiMood.length > 0 ? 'border-[rgba(255,191,0,0.2)]' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-3.5 h-3.5 text-accent-gold" />
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-accent-gold">ИИ-Миксолог</h3>
                </div>
                <p className="text-[11px] text-white/30 mb-3">Расскажите, что вы любите — ИИ подберёт идеальный микс</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {AI_MOODS.map(mood => {
                    const sel = aiMood.includes(mood.id);
                    return (
                      <button key={mood.id} type="button" onClick={() => setAiMood(prev => prev.includes(mood.id) ? prev.filter(id => id !== mood.id) : [...prev, mood.id])}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all border ${
                          sel ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-accent-gold' : 'bg-white/[0.02] border-transparent text-white/40 hover:border-[rgba(255,191,0,0.12)]'
                        }`}
                      >
                        <PremiumIcon name={mood.icon} size={14} className="mr-1 inline-block" />{mood.label}
                      </button>
                    );
                  })}
                </div>
                {aiRecommendations.length > 0 && (
                  <div className="p-3 rounded-xl bg-[rgba(255,191,0,0.03)] border border-[rgba(255,191,0,0.1)]">
                    <p className="text-[11px] text-accent-gold font-semibold mb-2 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Рекомендуемые вкусы
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {aiRecommendations.map(flavor => (
                        <button key={flavor} type="button" onClick={() => toggleFlavor(flavor)}
                          className={`px-2 py-1 rounded-lg text-[11px] border transition-all ${
                            selectedFlavors.includes(flavor)
                              ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.25)] text-accent-gold'
                              : 'bg-white/[0.03] border-white/5 text-white/50 hover:border-[rgba(255,191,0,0.15)]'
                          }`}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {aiMood.length === 0 && (
                  <p className="text-[11px] text-white/20 text-center py-2">Выберите настроение для рекомендации</p>
                )}
              </div>

              {/* AI Mixologist: Strength + Delivery Time */}
              {aiMood.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass bg-liquid-glass rounded-2xl p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3.5 h-3.5 text-accent-gold" />
                      <h4 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Крепость микса</h4>
                    </div>
                    <div className="flex gap-2">
                      {([
                        { id: 'light' as const, label: 'Лёгкая', icon: 'dove' },
                        { id: 'medium' as const, label: 'Средняя', icon: 'scale' },
                        { id: 'strong' as const, label: 'Крепкая', icon: 'muscle' },
                      ]).map(s => (
                        <button key={s.id} type="button" onClick={() => setAiStrength(s.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            aiStrength === s.id
                              ? s.id === 'light' ? 'bg-[rgba(76,175,80,0.1)] border-[rgba(76,175,80,0.3)] text-[#4CAF50]'
                                : s.id === 'medium' ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-accent-gold'
                                : 'bg-[rgba(244,67,54,0.1)] border-[rgba(244,67,54,0.3)] text-[#F44336]'
                              : 'bg-white/[0.02] border-transparent text-white/30 hover:border-white/10'
                          }`}
                        >
                          <PremiumIcon name={s.icon} size={14} /> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-3.5 h-3.5 text-accent-gold" />
                      <h4 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Когда принести</h4>
                    </div>
                    <div className="flex gap-1.5">
                      {['Сейчас', '15 мин', '30 мин', '1 час'].map(t => (
                        <button key={t} type="button" onClick={() => setAiDeliveryTime(t)}
                          className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all border ${
                            aiDeliveryTime === t
                              ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-accent-gold'
                              : 'bg-white/[0.02] border-transparent text-white/30 hover:border-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {isAuthenticated && (selectedFlavors.length > 0 || aiRecommendations.length > 0) && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveMix}
                  disabled={savingMix || mixSaved}
                  className="w-full py-2.5 rounded-xl border border-[rgba(255,191,0,0.2)] bg-[rgba(255,191,0,0.04)] hover:bg-[rgba(255,191,0,0.1)] disabled:opacity-40 text-[11px] font-bold text-accent-gold uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-2"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {mixSaved ? '✓ Сохранено' : savingMix ? 'Сохранение...' : 'Сохранить рецепт в профиль'}
                </motion.button>
              )}

              {isAuthenticated && userMixes.length > 0 && (
                <div className="liquid-glass bg-liquid-glass rounded-2xl p-4 border border-[rgba(255,191,0,0.08)]">
                  <button type="button" onClick={() => setShowSavedMixes(!showSavedMixes)}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-accent-gold" />
                      <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-white/70">Мои рецепты</h3>
                      <span className="text-[11px] text-white/30 ml-1">({userMixes.length})</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${showSavedMixes ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showSavedMixes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-3 pt-3 border-t border-white/5">
                          {userMixes.map(mix => (
                            <div key={mix.id}
                              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[rgba(255,191,0,0.15)] transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[rgba(255,191,0,0.08)] flex items-center justify-center flex-shrink-0">
                                <Flame className="w-3.5 h-3.5 text-accent-gold" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-white truncate">{mix.name}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray(mix.flavors) && mix.flavors.slice(0, 3).map((f: string) => (
                                    <span key={f} className="px-1.5 py-0.5 rounded bg-white/5 text-[11px] text-white/50">{f}</span>
                                  ))}
                                </div>
                                {mix.notes && (
                                  <p className="text-[10px] text-white/25 mt-1 truncate">{mix.notes}</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <button type="button" onClick={() => handleOrderSavedMix(mix)}
                                  className="px-3 py-1 rounded-lg bg-[rgba(255,191,0,0.12)] border border-[rgba(255,191,0,0.2)] text-accent-gold text-[11px] font-bold uppercase tracking-wider hover:bg-[rgba(255,191,0,0.2)] transition-all whitespace-nowrap"
                                >
                                  Заказать
                                </button>
                                <button type="button" onClick={() => handleDeleteUserMix(mix.id)}
                                  className="p-2.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all self-end min-h-[44px] min-w-[44px] flex items-center justify-center"
                                  aria-label="Удалить рецепт"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickOrder}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFD54F] text-black text-xs font-bold uppercase tracking-[0.12em] shadow-[0_4px_20px_rgba(255,191,0,0.25)] transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Оформить микс
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedMix && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-w-[calc(100vw-2rem)] bg-[#0D0F13] border border-[rgba(255,191,0,0.15)] rounded-[16px] p-4 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FFBF00] to-transparent" />
              <h3 className="text-lg font-bold text-white mb-1 font-heading">Детали заказа</h3>
              <p className="text-xs text-white/40 mb-6">
                Микс: <span className="text-accent-gold font-bold">{selectedMix.name}</span>
              </p>
              <form onSubmit={handleSubmit(onOrderSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-white/50">Пожелания</label>
                  <textarea {...register('specialNotes')} placeholder="Покислее, полегче..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white h-16 resize-none focus:border-accent-gold focus:outline-none transition-colors placeholder:text-white/20"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white transition-all"
                  >Отмена</button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFD54F] text-black text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,191,0,0.25)] transition-all disabled:opacity-50"
                  >{loading ? 'Отправка...' : 'Подтвердить'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
