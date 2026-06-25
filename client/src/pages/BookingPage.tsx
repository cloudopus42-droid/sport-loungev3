import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Clock, Sparkles,
  Bot, ThumbsUp, ShoppingCart, ChevronRight,
  Leaf, Zap
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { showToast } from '@/components/NotificationToast';

type Mix = any;

type Flavor = {
  id: string;
  name: string;
  category: string;
  emoji?: string;
  color?: string;
  is_active: boolean;
  price_value?: number;
};

const bookingFormSchema = z.object({
  specialNotes: z.string().max(500, 'Максимум 500 символов').optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const FALLBACK_FLAVORS: Flavor[] = [
  { id: '1', name: 'Двойное яблоко', category: 'Фрукты', emoji: '🍏', color: '#4CAF50', is_active: true },
  { id: '2', name: 'Манго-Маракуйя', category: 'Фрукты', emoji: '🥭', color: '#FF9800', is_active: true },
  { id: '3', name: 'Персик-Лайм', category: 'Фрукты', emoji: '🍑', color: '#FFB07C', is_active: true },
  { id: '4', name: 'Грейпфрут-Мята', category: 'Фрукты', emoji: '🍊', color: '#FF6B52', is_active: true },
  { id: '5', name: 'Клубника-Мята', category: 'Ягоды', emoji: '🍓', color: '#E91E63', is_active: true },
  { id: '6', name: 'Черника-Ежевика', category: 'Ягоды', emoji: '🫐', color: '#673AB7', is_active: true },
  { id: '7', name: 'Малина-Личи', category: 'Ягоды', emoji: '🫐', color: '#D32F2F', is_active: true },
  { id: '8', name: 'Арбуз-Дыня', category: 'Фрукты', emoji: '🍉', color: '#4CAF50', is_active: true },
  { id: '9', name: 'Банан-Шоколад', category: 'Десерт', emoji: '🍌', color: '#795548', is_active: true },
  { id: '10', name: 'Кокос-Ваниль', category: 'Десерт', emoji: '🥥', color: '#D7CCC8', is_active: true },
  { id: '11', name: 'Лимон-Имбирь', category: 'Пряные', emoji: '🍋', color: '#FFEB3B', is_active: true },
  { id: '12', name: 'Мята-Айс', category: 'Свежие', emoji: '🧊', color: '#00BCD4', is_active: true },
  { id: '13', name: 'Кактус-Фрост', category: 'Свежие', emoji: '🌵', color: '#009688', is_active: true },
  { id: '14', name: 'Виноград-Ягоды', category: 'Ягоды', emoji: '🍇', color: '#9C27B0', is_active: true },
  { id: '15', name: 'Sport Mix (авторский)', category: 'Авторские', emoji: '🔥', color: '#FF5722', is_active: true },
  { id: '16', name: 'Lounge Premium', category: 'Авторские', emoji: '💎', color: '#FFBF00', is_active: true },
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
  const [flavors, setFlavors] = useState<Flavor[]>(FALLBACK_FLAVORS);
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [selectedMix, setSelectedMix] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMixBuilder, setShowMixBuilder] = useState(false);

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [flavorCategory, setFlavorCategory] = useState('Все');
  const [activeTab, setActiveTab] = useState<'mixes' | 'ai'>('mixes');
  const [aiMood, setAiMood] = useState<string[]>([]);
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { specialNotes: '' },
  });

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
    const ac = new AbortController();
    api<Flavor[]>('/api/flavors', { signal: ac.signal })
      .then((data) => {
        if (data?.length) {
          const active = data.filter(f => f.is_active !== false);
          setFlavors(active.length > 0 ? active : FALLBACK_FLAVORS);
        }
      })
      .catch(() => {});
    return () => { loadMixesRef.current?.abort(); ac.abort(); };
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
        mix_id: isCustom ? null : selectedMix.id, notes: finalNotes,
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
      name: selectedFlavors.length > 0 ? `Микс: ${selectedFlavors.join(', ')}` : 'Авторский микс',
      description: selectedFlavors.length > 0 ? `Вкусы: ${selectedFlavors.join(', ')}` : 'Соберите свой идеальный вкус',
      strength: strength === 'light' ? 3 : strength === 'medium' ? 6 : 9,
      isCustom: true,
    });
    setShowConfirmModal(true);
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#FFBF00] opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#8D6B3D] opacity-[0.02] blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Single-column full-width form layout */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5 pb-24">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFBF00]/20 bg-[#FFBF00]/5 text-[9px] font-semibold text-[#FFBF00] uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3 h-3" /> Premium Hookah Assembly
            </div>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-1 font-heading">
              Собери свой <span className="text-[#FFBF00]">кальян</span>
            </h1>
            <p className="text-white/40 text-xs max-w-md">
              Выберите чашу, жидкость и вкусы — 3D-кальян изменится в реальном времени
            </p>
          </div>

          {/* Flavor Selection */}
          <div className="liquid-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-3.5 h-3.5 text-[#FFBF00]" />
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
              {flavors
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
              <Zap className="w-3.5 h-3.5 text-[#FFBF00]" />
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

          {/* Order Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuickOrder}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFD54F] text-black text-xs font-bold uppercase tracking-[0.12em] shadow-[0_4px_20px_rgba(255,191,0,0.25),0_0_40px_rgba(255,191,0,0.1)] hover:shadow-[0_4px_28px_rgba(255,191,0,0.35),0_0_50px_rgba(255,191,0,0.15)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Заказать
          </motion.button>

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
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FFBF00] to-[#FFD54F] text-black text-[9px] font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,191,0,0.25)] transition-all disabled:opacity-50"
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
