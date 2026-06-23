import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Flame, Clock, Sparkles, AlertCircle,
  Bot, ThumbsUp, ShoppingCart, ChevronRight,
  Droplets, Leaf, Star, Zap
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { HookahScene } from '@/components/three/HookahScene';
import api from '@/lib/api';
import { showToast } from '@/components/NotificationToast';

type Mix = any;

const bookingFormSchema = z.object({
  liquidBase: z.string().min(1, 'Укажите базу'),
  specialNotes: z.string().max(500, 'Максимум 500 символов').optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const BOWL_OPTIONS = [
  { index: 0, name: 'Cosmo Bowl', icon: '🏺', desc: 'Классическая глина', color: '#C4956A' },
  { index: 1, name: 'Грейпфрут', icon: '🍊', desc: 'Цитрусовая свежесть', color: '#FF6B52' },
  { index: 2, name: 'Кактус', icon: '🌵', desc: 'Экзотическая подача', color: '#4CAF50' },
  { index: 3, name: 'Ананас', icon: '🍍', desc: 'Тропический вкус', color: '#D4A017' },
  { index: 4, name: 'Апельсин', icon: '🍊', desc: 'Сочная классика', color: '#FF8C00' },
];

const LIQUID_OPTIONS = [
  { index: 0, name: 'Вода с блёстками', color: '#87CEEB', desc: 'Лёгкое сияние' },
  { index: 1, name: 'Вино', color: '#8B0000', desc: 'Рубиновый цвет' },
  { index: 2, name: 'Кола', color: '#3C1414', desc: 'Активные пузырьки' },
  { index: 3, name: 'Сок', color: '#FFA500', desc: 'Яркий цитрус' },
  { index: 4, name: 'Вода', color: '#B0E0E6', desc: 'Чистая прозрачность' },
];

const FLAVOR_OPTIONS = [
  { name: 'Двойное яблоко', cat: 'Фрукты', emoji: '🍏', color: '#4CAF50' },
  { name: 'Манго-Маракуйя', cat: 'Фрукты', emoji: '🥭', color: '#FF9800' },
  { name: 'Персик-Лайм', cat: 'Фрукты', emoji: '🍑', color: '#FFB07C' },
  { name: 'Грейпфрут-Мята', cat: 'Фрукты', emoji: '🍊', color: '#FF6B52' },
  { name: 'Клубника-Мята', cat: 'Ягоды', emoji: '🍓', color: '#E91E63' },
  { name: 'Черника-Ежевика', cat: 'Ягоды', emoji: '🫐', color: '#673AB7' },
  { name: 'Малина-Личи', cat: 'Ягоды', emoji: '🫐', color: '#D32F2F' },
  { name: 'Арбуз-Дыня', cat: 'Фрукты', emoji: '🍉', color: '#4CAF50' },
  { name: 'Банан-Шоколад', cat: 'Десерт', emoji: '🍌', color: '#795548' },
  { name: 'Кокос-Ваниль', cat: 'Десерт', emoji: '🥥', color: '#D7CCC8' },
  { name: 'Лимон-Имбирь', cat: 'Пряные', emoji: '🍋', color: '#FFEB3B' },
  { name: 'Мята-Айс', cat: 'Свежие', emoji: '🧊', color: '#00BCD4' },
  { name: 'Кактус-Фрост', cat: 'Свежие', emoji: '🌵', color: '#009688' },
  { name: 'Виноград-Ягоды', cat: 'Ягоды', emoji: '🍇', color: '#9C27B0' },
  { name: 'Sport Mix (авторский)', cat: 'Авторские', emoji: '🔥', color: '#FF5722' },
  { name: 'Lounge Premium', cat: 'Авторские', emoji: '💎', color: '#B08D57' },
];

const FLAVOR_CATS = ['Все', 'Фрукты', 'Ягоды', 'Десерт', 'Пряные', 'Свежие', 'Авторские'];

const AI_MOODS = [
  { id: 'sweet', label: 'Сладкий', emoji: '🍯', desc: 'Фруктовые и десертные ноты' },
  { id: 'strong', label: 'Крепкий', emoji: '💪', desc: 'Насыщенный дым и крепость' },
  { id: 'fresh', label: 'Свежий', emoji: '🌿', desc: 'Мятные и цитрусовые оттенки' },
  { id: 'berry', label: 'Ягодный', emoji: '🫐', desc: 'Лесные и садовые ягоды' },
  { id: 'exotic', label: 'Экзотика', emoji: '🌴', desc: 'Тропические сочетания' },
  { id: 'classic', label: 'Классика', emoji: '🏆', desc: 'Проверенные временем вкусы' },
];

const PRICES = [500, 750, 1000];

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

  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [selectedMix, setSelectedMix] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMixBuilder, setShowMixBuilder] = useState(false);

  const [bowlIndex, setBowlIndex] = useState(0);
  const [liquidIndex, setLiquidIndex] = useState(0);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [flavorCategory, setFlavorCategory] = useState('Все');
  const [activeTab, setActiveTab] = useState<'mixes' | 'ai'>('mixes');
  const [aiMood, setAiMood] = useState<string[]>([]);
  const [price, setPrice] = useState(750);
  const [strength, setStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [masterCalled, setMasterCalled] = useState(false);
  const [timeText, setTimeText] = useState('15:00');
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const timerIntervalRef = useRef<any>(null);
  const loadMixesRef = useRef<AbortController | null>(null);
  const fetchOrderStatusRef = useRef<AbortController | null>(null);

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

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { liquidBase: 'water', specialNotes: '' },
  });

  const currentLiquidBase = watch('liquidBase');

  const loadMixes = () => {
    loadMixesRef.current?.abort();
    const ac = new AbortController();
    loadMixesRef.current = ac;
    setLoading(true);
    let localCustomMix: any = null;
    try {
      const saved = localStorage.getItem('my_saved_mix') || localStorage.getItem('prefilled_mix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.hookahMix?.length > 0) {
          localCustomMix = {
            id: 'custom-saved-mix',
            name: 'Мой рецепт (ИИ-Миксолог)',
            description: `Сборка: ${parsed.hookahMix.map((n: string) => `${n} (${parsed.mixPercentages[n]}%)`).join(', ')}`,
            strength: parsed.hookahStrength === 'light' ? 3 : parsed.hookahStrength === 'medium' ? 6 : 9,
            isCustom: true,
            raw: parsed,
          };
        }
      }
    } catch (e) {}
    setMixes(localCustomMix ? [localCustomMix] : []);
    api<Mix[]>('/api/mixes', { signal: ac.signal })
      .then(data => setMixes(prev => localCustomMix ? [localCustomMix, ...(data || [])] : data || []))
      .catch((err: any) => { if (err?.name !== 'AbortError') showToast('Сеть недоступна', 'error'); })
      .finally(() => setLoading(false));
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
    loadMixes();
    return () => { loadMixesRef.current?.abort(); };
  }, []);

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

  const handleMixSelect = (mix: Mix) => {
    if (!isAuthenticated) { showToast('Авторизуйтесь для оформления заказа', 'error'); navigate('/login?redirect=/booking'); return; }
    setSelectedMix(mix);
    setShowConfirmModal(true);
  };

  const onOrderSubmit = async (data: BookingFormValues) => {
    if (!selectedMix) return;
    setLoading(true);
    try {
      const isCustom = selectedMix.isCustom;
      let finalNotes = data.specialNotes || '';
      if (isCustom && selectedMix.raw) {
        const raw = selectedMix.raw;
        finalNotes = `[ИИ-Микс: ${raw.hookahMix.map((n: string) => `${n} (${raw.mixPercentages[n]}%)`).join(', ')}] ${finalNotes}`;
      }
      const res = await api('/api/orders', { method: 'POST', body: {
        mix_id: isCustom ? null : selectedMix.id, liquid_id: data.liquidBase, notes: finalNotes,
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

  const handleCallMaster = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try { await api(`/api/orders/${activeOrder.id}/request-master`, { method: 'POST' }); setMasterCalled(true); showToast('Мастер вызван к вашему столу', 'success'); }
    catch (err) { showToast('Ошибка вызова мастера', 'error'); }
    finally { setLoading(false); }
  };

  const handleQuickOrder = () => {
    if (!isAuthenticated) { showToast('Авторизуйтесь для оформления заказа', 'error'); navigate('/login?redirect=/booking'); return; }
    setSelectedMix({
      id: 'custom-quick',
      name: `Собранный: ${BOWL_OPTIONS[bowlIndex].name} + ${LIQUID_OPTIONS[liquidIndex].name}`,
      description: `Чаша: ${BOWL_OPTIONS[bowlIndex].name}, жидкость: ${LIQUID_OPTIONS[liquidIndex].name}${selectedFlavors.length ? ', вкусы: ' + selectedFlavors.join(', ') : ''}`,
      strength: strength === 'light' ? 3 : strength === 'medium' ? 6 : 9,
      isCustom: true,
    });
    setShowConfirmModal(true);
  };

  const flavorIcons = useMemo(() => {
    const map: Record<string, { emoji: string; color: string }> = {};
    FLAVOR_OPTIONS.forEach(f => map[f.name] = { emoji: f.emoji, color: f.color });
    return selectedFlavors.map(f => map[f] || { emoji: '🔥', color: '#FF5722' });
  }, [selectedFlavors]);

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#FFBF00] opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#B08D57] opacity-[0.02] blur-[130px] rounded-full pointer-events-none z-0" />

      {/* TZ-mandated layout: two-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
        
        {/* Left: 3D Hookah Visualization (60%) */}
        <div className="lg:col-span-7 relative min-h-[50vh] lg:min-h-screen bg-dark-bg">
          <div className="sticky top-0 h-[50vh] lg:h-screen flex flex-col items-center justify-center">
            {/* Flavor icons overlay */}
            <div className="absolute top-1/4 right-4 lg:right-12 z-20 flex flex-col gap-2">
              {flavorIcons.map((fi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-[0_0_16px_rgba(255,191,0,0.1)]"
                  style={{ background: `rgba(255,191,0,0.08)`, border: '0.5px solid rgba(255,191,0,0.2)' }}
                >
                  {fi.emoji}
                </motion.div>
              ))}
            </div>

            <div className="w-full h-full relative">
              <HookahScene bowlIndex={bowlIndex} liquidIndex={liquidIndex} />
              {/* Gold progress bar */}
              <div className="absolute bottom-8 left-[15%] right-[15%] h-px bg-[rgba(255,191,0,0.06)]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#B08D57] via-[#FFBF00] to-[#B08D57]"
                  style={{ width: `${((bowlIndex + 1) / BOWL_OPTIONS.length) * 100}%` }}
                  animate={{ width: `${((bowlIndex + 1) / BOWL_OPTIONS.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
              {/* Bowl/liquid labels */}
              <div className="absolute bottom-12 left-[15%] right-[15%] flex justify-between text-[9px] uppercase tracking-[0.2em] text-white/20">
                <span className="text-[#FFBF00]/40">{BOWL_OPTIONS[bowlIndex].name}</span>
                <span className="text-[#B08D57]/40">{LIQUID_OPTIONS[liquidIndex].name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selection Panel (40%) — scrollable */}
        <div className="lg:col-span-5 overflow-y-auto lg:h-screen p-4 lg:p-8 space-y-5 pb-24 lg:pb-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFBF00]/20 bg-[#FFBF00]/5 text-[9px] font-semibold text-[#FFBF00] uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3 h-3" /> Premium Hookay Assembly
            </div>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-1 font-heading">
              Собери свой <span className="text-[#FFBF00]">кальян</span>
            </h1>
            <p className="text-white/40 text-xs max-w-md">
              Выберите чашу, жидкость и вкусы — 3D-кальян изменится в реальном времени
            </p>
          </div>

          {/* Bowl Selection */}
          <div className="liquid-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-[#FFBF00]" />
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70">Чаша</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {BOWL_OPTIONS.map((bowl) => (
                <motion.button
                  key={bowl.index}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setBowlIndex(bowl.index)}
                  className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-300 ${
                    bowlIndex === bowl.index
                      ? 'bg-[rgba(255,191,0,0.08)] border border-[rgba(255,191,0,0.3)] shadow-[0_0_16px_rgba(255,191,0,0.05)]'
                      : 'bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[rgba(255,191,0,0.15)]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{
                      background: bowlIndex === bowl.index
                        ? `linear-gradient(135deg, ${bowl.color}33, ${bowl.color}11)`
                        : 'rgba(255,255,255,0.03)',
                      border: `0.5px solid ${bowlIndex === bowl.index ? bowl.color + '66' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    {bowl.icon}
                  </div>
                  <span className={`text-[8px] font-medium text-center leading-tight ${bowlIndex === bowl.index ? 'text-[#FFBF00]' : 'text-white/40'}`}>
                    {bowl.name}
                  </span>
                  {bowlIndex === bowl.index && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFBF00] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-[#0b0807]" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Liquid Selection */}
          <div className="liquid-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-3.5 h-3.5 text-[#B08D57]" />
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70">Жидкость</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {LIQUID_OPTIONS.map((liquid) => (
                <motion.button
                  key={liquid.index}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setLiquidIndex(liquid.index)}
                  className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-300 ${
                    liquidIndex === liquid.index
                      ? 'bg-[rgba(176,141,87,0.06)] border border-[rgba(176,141,87,0.25)]'
                      : 'bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[rgba(176,141,87,0.12)]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: liquidIndex === liquid.index
                        ? `linear-gradient(135deg, ${liquid.color}44, ${liquid.color}11)`
                        : 'rgba(255,255,255,0.03)',
                      border: `0.5px solid ${liquidIndex === liquid.index ? liquid.color + '66' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: liquid.color, opacity: 0.6 }}
                    />
                  </div>
                  <span className={`text-[8px] font-medium text-center leading-tight ${liquidIndex === liquid.index ? 'text-[#B08D57]' : 'text-white/40'}`}>
                    {liquid.name}
                  </span>
                  {liquidIndex === liquid.index && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B08D57] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-[#0b0807]" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Flavor Selection */}
          <div className="liquid-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-3.5 h-3.5 text-[#B08D57]" />
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70">Вкусы (до 4)</h3>
              <span className="ml-auto text-[9px] text-white/30">{selectedFlavors.length}/4</span>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide mb-2">
              {FLAVOR_CATS.map(cat => (
                <button key={cat} onClick={() => setFlavorCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[8px] font-semibold whitespace-nowrap transition-all border ${
                    flavorCategory === cat
                      ? 'bg-[#FFBF00] text-[#0b0807] border-[#FFBF00]/30'
                      : 'text-white/40 bg-white/5 border-transparent hover:border-[#FFBF00]/20'
                  }`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
              {FLAVOR_OPTIONS
                .filter(f => flavorCategory === 'Все' || f.category === flavorCategory)
                .map(flavor => {
                  const sel = selectedFlavors.includes(flavor.name);
                  return (
                    <motion.button key={flavor.name} whileTap={{ scale: 0.96 }}
                      onClick={() => toggleFlavor(flavor.name)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all border ${
                        sel
                          ? 'bg-[rgba(255,191,0,0.08)] border-[rgba(255,191,0,0.25)] text-[#FFBF00]'
                          : 'bg-white/[0.02] border-transparent text-white/40 hover:border-[rgba(255,191,0,0.12)]'
                      }`}
                    >
                      <span>{flavor.emoji}</span>
                      <span className="truncate">{flavor.name}</span>
                    </motion.button>
                  );
                })}
            </div>
          </div>

          {/* Strength */}
          <div className="liquid-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#B08D57]" />
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70">Крепость</h3>
            </div>
            <div className="flex gap-2">
              {(['light', 'medium', 'strong'] as const).map(s => (
                <button key={s} onClick={() => setStrength(s)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-semibold transition-all border ${
                    strength === s
                      ? s === 'light' ? 'bg-[rgba(76,175,80,0.1)] border-[rgba(76,175,80,0.3)] text-[#4CAF50]'
                        : s === 'medium' ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-[#FFBF00]'
                        : 'bg-[rgba(244,67,54,0.1)] border-[rgba(244,67,54,0.3)] text-[#F44336]'
                      : 'bg-white/[0.02] border-transparent text-white/30 hover:border-white/10'
                  }`}
                >
                  {s === 'light' ? 'Лёгкая' : s === 'medium' ? 'Средняя' : 'Крепкая'}
                </button>
              ))}
            </div>
          </div>

          {/* AI Mixologist */}
          <div className={`liquid-glass rounded-2xl p-4 border ${aiMood.length > 0 ? 'border-[rgba(255,191,0,0.2)]' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-3.5 h-3.5 text-[#FFBF00]" />
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#FFBF00]">ИИ-Миксолог</h3>
            </div>
            <p className="text-[9px] text-white/30 mb-3">Расскажите, что вы любите — ИИ подберёт идеальный микс</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {AI_MOODS.map(mood => {
                const sel = aiMood.includes(mood.id);
                return (
                  <button key={mood.id} onClick={() => setAiMood(prev => prev.includes(mood.id) ? prev.filter(id => id !== mood.id) : [...prev, mood.id])}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] transition-all border ${
                      sel ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-[#FFBF00]' : 'bg-white/[0.02] border-transparent text-white/40 hover:border-[rgba(255,191,0,0.12)]'
                    }`}
                  >
                    <span className="mr-1">{mood.emoji}</span>{mood.label}
                  </button>
                );
              })}
            </div>
            {aiRecommendations.length > 0 && (
              <div className="p-3 rounded-xl bg-[rgba(255,191,0,0.03)] border border-[rgba(255,191,0,0.1)]">
                <p className="text-[9px] text-[#FFBF00] font-semibold mb-2 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> Рекомендуемые вкусы
                </p>
                <div className="flex flex-wrap gap-1">
                  {aiRecommendations.map(flavor => (
                    <button key={flavor} onClick={() => toggleFlavor(flavor)}
                      className={`px-2 py-1 rounded-lg text-[8px] border transition-all ${
                        selectedFlavors.includes(flavor)
                          ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.25)] text-[#FFBF00]'
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
              <p className="text-[8px] text-white/20 text-center py-2">Выберите настроение для рекомендации</p>
            )}
          </div>

          {/* Price & Order */}
          <div className="liquid-glass rounded-2xl p-5 border border-[rgba(255,191,0,0.12)] bg-gradient-to-br from-[rgba(255,191,0,0.03)] to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1">Цена</p>
                <div className="flex gap-2">
                  {PRICES.map(p => (
                    <button key={p} onClick={() => setPrice(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        price === p
                          ? 'bg-[rgba(255,191,0,0.1)] border-[rgba(255,191,0,0.3)] text-[#FFBF00]'
                          : 'bg-white/[0.02] border-transparent text-white/30 hover:border-white/10'
                      }`}
                    >{p} ₽</button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Итого</p>
                <p className="text-2xl font-bold font-heading text-[#FFBF00]">{price} ₽</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickOrder}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#B08D57] text-[#0b0807] text-xs font-bold uppercase tracking-[0.12em] shadow-[0_0_24px_rgba(255,191,0,0.1)] hover:shadow-[0_0_32px_rgba(255,191,0,0.2)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Заказать
            </motion.button>
          </div>

          {/* Active Order Tracker (collapsible) */}
          {activeOrder && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass rounded-2xl p-4 border border-[rgba(255,191,0,0.08)]"
            >
              <button onClick={() => setShowOrderTracker(!showOrderTracker)}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70">Статус заказа</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#FFBF00]">{timeText}</span>
                  <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${showOrderTracker ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {showOrderTracker && (
                <div className="space-y-3 pl-3">
                  <div className="absolute left-[18px] top-8 bottom-4 w-px bg-gradient-to-b from-[#FFBF00] to-white/5" />
                  {stages.map((stage, idx) => {
                    const stagesList = stages.map(s => s.id);
                    const currentIdx = stagesList.indexOf(activeOrder.status);
                    const isCompleted = currentIdx > idx;
                    const isActive = currentIdx === idx;
                    return (
                      <div key={stage.id} className={`flex items-start gap-3 relative ${isCompleted || isActive ? 'opacity-100' : 'opacity-20'}`}>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center z-10 ${
                          isActive ? 'border-[#FFBF00] text-[#FFBF00]' : isCompleted ? 'border-[#FFBF00] text-[#FFBF00]' : 'border-white/10 text-white/20'
                        }`}>
                          {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#FFBF00]' : 'bg-transparent'}`} />}
                        </div>
                        <div className="pt-0.5">
                          <h5 className={`text-[10px] uppercase tracking-wider font-bold ${isActive ? 'text-[#FFBF00]' : 'text-white'}`}>{stage.label}</h5>
                          <p className="text-[8px] text-white/30">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={handleCallMaster} disabled={masterCalled}
                    className="mt-3 w-full py-2.5 rounded-xl border border-[rgba(255,191,0,0.2)] bg-[rgba(255,191,0,0.04)] hover:bg-[rgba(255,191,0,0.1)] disabled:bg-white/5 disabled:border-white/10 text-[9px] font-bold text-[#FFBF00] disabled:text-white/20 uppercase tracking-[0.12em] transition-all"
                  >
                    {masterCalled ? 'Вызов отправлен' : 'Позвать мастера'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedMix && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0D0F13] border border-[rgba(255,191,0,0.15)] rounded-[16px] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FFBF00] to-transparent" />
              <h3 className="text-lg font-bold text-white mb-1 font-heading">Детали заказа</h3>
              <p className="text-xs text-white/40 mb-6">
                Микс: <span className="text-[#FFBF00] font-bold">{selectedMix.name}</span>
              </p>
              <form onSubmit={handleSubmit(onOrderSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-white/50">База для колбы</label>
                  <input type="hidden" {...register('liquidBase')} />
                  <div className="grid grid-cols-2 gap-2">
                    {LIQUID_OPTIONS.map(l => (
                      <button key={l.index} type="button" onClick={() => setValue('liquidBase', `liquid_${l.index}`, { shouldValidate: true })}
                        className={`text-left p-3 rounded-xl border transition-all ${currentLiquidBase === `liquid_${l.index}` ? 'border-[#FFBF00] bg-[rgba(255,191,0,0.05)]' : 'border-white/5 hover:border-white/20 bg-white/[0.01]'}`}
                      >
                        <div className="text-[10px] font-semibold text-white">{l.name}</div>
                        <div className="text-[8px] text-[#B08D57] mt-0.5">Включено</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-white/50">Пожелания</label>
                  <textarea {...register('specialNotes')} placeholder="Покислее, полегче..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white h-16 resize-none focus:border-[#FFBF00] focus:outline-none transition-colors placeholder:text-white/20"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-[9px] font-bold uppercase tracking-wider text-white transition-all"
                  >Отмена</button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#B08D57] text-[#0b0807] text-[9px] font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,191,0,0.1)] transition-all disabled:opacity-50"
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
