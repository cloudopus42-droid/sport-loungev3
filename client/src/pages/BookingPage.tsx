import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Flame, 
  Clock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { showToast } from '@/components/NotificationToast';

type Mix = any;

const bookingFormSchema = z.object({
  seatLabel: z.string().min(1, 'Укажите стол'),
  liquidBase: z.string().min(1, 'Укажите базу'),
  specialNotes: z.string().max(500, 'Максимум 500 символов').optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const LIQUID_BASES = [
  { id: 'water', name: 'На воде', price: 0, desc: 'Классическая чистая фильтрация' },
  { id: 'milk', name: 'На молоке', price: 150, desc: 'Плотный сливочный пар' },
  { id: 'juice', name: 'На соке', price: 200, desc: 'Свежие фруктовые ноты' },
  { id: 'wine', name: 'На вине', price: 450, desc: 'Изысканная винная ароматика' },
];

const TABLE_OPTIONS = [
  'Стол 1', 'Стол 2', 'Стол 3', 'VIP Кабинет 1', 'Игровая Зона 1'
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

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      seatLabel: TABLE_OPTIONS[0],
      liquidBase: 'water',
      specialNotes: '',
    }
  });

  const currentLiquidBase = watch('liquidBase');
  const [masterCalled, setMasterCalled] = useState(false);
  const [timeText, setTimeText] = useState('15:00');
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    
    // Load local custom mix first if available
    let localCustomMix: any = null;
    try {
      const saved = localStorage.getItem('my_saved_mix') || localStorage.getItem('prefilled_mix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.hookahMix && parsed.hookahMix.length > 0) {
          localCustomMix = {
            id: 'custom-saved-mix',
            name: 'Мой рецепт (ИИ-Миксолог)',
            description: `Сборка: ${parsed.hookahMix.map((n: string) => `${n} (${parsed.mixPercentages[n]}%)`).join(', ')}. Чаша: ${parsed.bowlType || 'глина'}.`,
            strength: parsed.hookahStrength === 'light' ? 3 : parsed.hookahStrength === 'medium' ? 6 : 9,
            isCustom: true,
            raw: parsed
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved custom mix:', e);
    }

    setMixes(localCustomMix ? [localCustomMix] : []);

    api.get<Mix[]>('/api/mixes')
      .then(res => {
        const serverList = res.data || [];
        const combined = localCustomMix ? [localCustomMix, ...serverList] : serverList;
        setMixes(combined);
      })
      .catch(() => {
        showToast('Сеть недоступна, показано локальное меню', 'error');
      })
      .finally(() => setLoading(false));

    const savedOrderId = localStorage.getItem('current_order_id');
    if (savedOrderId && isAuthenticated) {
      fetchOrderStatus(savedOrderId);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:updated', (data: any) => {
      const savedId = localStorage.getItem('current_order_id');
      if (data && data.id === savedId) {
        setActiveOrder(data);
        if (data.status === 'done') {
          showToast('Ваш кальян готов! Приятного покура! 💨', 'success');
        }
      }
    });
    return () => { socket.off('order:updated'); };
  }, [socket]);

  useEffect(() => {
    if (!activeOrder) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    const tick = () => {
      const diff = new Date(activeOrder.promisedDeliveryTime).getTime() - Date.now();
      if (activeOrder.status === 'done') {
        setTimeText('ГОТОВ');
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
      }
      if (diff <= 0) {
        setTimeText('СКОРО БУДЕТ');
      } else {
        const m = Math.floor(diff / 1000 / 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeText(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    const pollInterval = setInterval(() => fetchOrderStatus(activeOrder.id), 8000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      clearInterval(pollInterval);
    };
  }, [activeOrder]);

  const fetchOrderStatus = (id: string) => {
    api.get(`/api/orders/${id}/status`)
      .then(res => setActiveOrder(res.data))
      .catch(() => {
        localStorage.removeItem('current_order_id');
        setActiveOrder(null);
      });
  };

  const handleMixSelect = (mix: Mix) => {
    if (!isAuthenticated) { 
      showToast('Пожалуйста, авторизуйтесь для оформления заказа', 'error'); 
      navigate('/login?redirect=/booking');
      return; 
    }
    setSelectedMix(mix);
    
    // Auto-prefill if it's the custom mix
    if (mix.isCustom && mix.raw) {
      setValue('liquidBase', mix.raw.liquidBase || 'water');
      setValue('specialNotes', mix.raw.comment || '');
    } else {
      setValue('liquidBase', 'water');
      setValue('specialNotes', '');
    }
    
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
        const mixDetails = raw.hookahMix.map((n: string) => `${n} (${raw.mixPercentages[n]}%)`).join(', ');
        finalNotes = `[ИИ-Микс: ${mixDetails}. Чаша: ${raw.bowlType || 'глина'}] ${finalNotes}`;
      }

      const res = await api.post('/api/orders', {
        mix_id: isCustom ? null : selectedMix.id,
        liquid_id: data.liquidBase,
        notes: finalNotes,
        seat_id: data.seatLabel.replace(/\s+/g, '-').toLowerCase(),
        seat_label: data.seatLabel,
        seat_zone: 'hall',
      });
      setActiveOrder(res.data);
      localStorage.setItem('current_order_id', res.data.id);
      setShowConfirmModal(false);
      reset();
      showToast('Заказ успешно принят!', 'success');
    } catch (err) {
      showToast('Не удалось оформить заказ', 'error');
    } finally { setLoading(false); }
  };

  const handleCallMaster = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      await api.post(`/api/orders/${activeOrder.id}/request-master`);
      setMasterCalled(true);
      showToast('Кальянный мастер вызван к вашему столу', 'success');
    } catch (err) {
      showToast('Ошибка вызова мастера', 'error');
    } finally { setLoading(false); }
  };

  const stages = [
    { id: 'accepted', label: 'Принят', desc: 'Заказ зарегистрирован' },
    { id: 'preparing', label: 'Подготовка', desc: 'Сборка микса и забивка чаши' },
    { id: 'roasting', label: 'Прогрев', desc: 'Разогрев углей' },
    { id: 'delivering', label: 'Подача', desc: 'Вынос кальяна к столу' },
    { id: 'done', label: 'Подан', desc: 'Кальян готов, приятного покура!' },
  ];

  return (
    <div className="relative min-h-[85vh] bg-[#07050a]/90 text-white overflow-hidden rounded-[2rem] border border-[#d4af37]/20 shadow-[0_0_80px_rgba(212,175,55,0.1)] flex flex-col mb-20 font-sans backdrop-blur-xl">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="luxGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#luxGrid)" />
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37] opacity-[0.05] blur-[130px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#a855f7] opacity-[0.05] blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-12 z-10 relative flex flex-col h-full">
        
        {/* Header */}
        <header className="mb-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 text-[10px] font-semibold text-accent-gold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3 h-3" /> Premium Hookah Service
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
            Заказ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f3e5ab]">Кальяна</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl">
            Выберите один из наших фирменных миксов от профессиональных миксологов или соберите свой с помощью ИИ.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Mixes List */}
          <section className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider text-accent-gold">Доступные Миксы</h2>
              <span className="text-xs text-white/40">{mixes.length} вариантов</span>
            </div>
            
            {loading && mixes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-accent-gold border-t-transparent animate-spin"></div>
                <p className="text-xs text-white/40">Загрузка меню...</p>
              </div>
            ) : mixes.length === 0 ? (
              <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.02]">
                <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">Нет доступных миксов. Попробуйте обновить страницу.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mixes.map((mix, idx) => (
                  <motion.div
                    key={mix.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="group relative p-5 rounded-2xl bg-[#120e1a]/40 border border-[#d4af37]/10 hover:border-[#d4af37]/40 transition-all cursor-pointer backdrop-blur-md overflow-hidden"
                    onClick={() => handleMixSelect(mix)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                            <Flame className="w-4 h-4 text-[#d4af37]" />
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-accent-gold/80 border border-white/5">
                            Крепость: {mix.strength}/10
                          </span>
                        </div>
                        <h3 className="font-bold text-sm tracking-wide text-white group-hover:text-accent-gold transition-colors mb-1">{mix.name}</h3>
                        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-4">{mix.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-accent-gold/80 group-hover:text-white transition-colors">Выбрать →</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Active Order / Status Tracker */}
          <section className="lg:col-span-5">
            <div className="flex items-center border-b border-white/10 pb-3 mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider text-accent-gold">Статус заказа</h2>
            </div>
            
            <div className="p-6 rounded-3xl bg-[#120e1a]/60 border border-[#d4af37]/15 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none"></div>

              {!activeOrder ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">Нет активного заказа</h3>
                  <p className="text-xs text-white/40 max-w-[240px] mx-auto leading-relaxed">
                    Выберите понравившийся микс из списка слева, настройте базу и стол, чтобы сделать заказ.
                  </p>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col">
                  {/* Timer & Table info */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
                    <div>
                      <p className="text-[9px] text-accent-gold uppercase tracking-wider font-semibold mb-1">Приблизительное время подачи</p>
                      <h4 className="text-3xl font-mono font-bold tracking-tight text-white">{timeText}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-1">Ваш Стол</p>
                      <p className="text-xs font-bold text-accent-gold uppercase bg-[#d4af37]/10 px-2.5 py-1 rounded-lg border border-[#d4af37]/20">{activeOrder.seatLabel}</p>
                    </div>
                  </div>

                  {/* Stepper progress */}
                  <div className="relative pl-3 space-y-6">
                    {/* Vertical line connector */}
                    <div className="absolute left-[20px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-[#d4af37] to-white/10"></div>
                    
                    {stages.map((stage, idx) => {
                      const stagesList = stages.map(s => s.id);
                      const currentIdx = stagesList.indexOf(activeOrder.status);
                      const targetIdx = idx;
                      const isCompleted = currentIdx > targetIdx;
                      const isActive = currentIdx === targetIdx;
                      
                      return (
                        <div key={stage.id} className={`flex items-start gap-4 relative transition-all duration-300 ${isCompleted || isActive ? 'opacity-100' : 'opacity-25'}`}>
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-[#07050a] z-10 ${isActive ? 'border-[#d4af37] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : isCompleted ? 'border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/20'}`}>
                            {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#d4af37] animate-pulse' : 'bg-transparent'}`}></div>}
                          </div>
                          <div className="pt-1.5">
                            <h5 className={`text-xs uppercase tracking-wider font-extrabold ${isActive ? 'text-accent-gold' : 'text-white'}`}>{stage.label}</h5>
                            <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{stage.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Call Master button */}
                  <button 
                    onClick={handleCallMaster}
                    disabled={masterCalled}
                    className="mt-8 w-full py-3.5 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 hover:bg-[#d4af37]/15 disabled:bg-white/5 disabled:border-white/10 text-[10px] font-bold text-accent-gold disabled:text-white/30 uppercase tracking-[0.15em] transition-all duration-300"
                  >
                    {masterCalled ? 'Вызов отправлен' : 'Позвать кальянного мастера'}
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Booking Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedMix && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e0c12] border border-[#d4af37]/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(212,175,55,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-50"></div>
              
              <h3 className="text-lg font-bold text-white mb-1">Детали заказа</h3>
              <p className="text-xs text-white/40 mb-6">Вы выбрали микс: <span className="text-accent-gold font-bold">{selectedMix.name}</span></p>
              
              <form onSubmit={handleSubmit(onOrderSubmit)} className="space-y-5">
                
                {/* Table Choice */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1">Выберите стол</label>
                  <select {...register('seatLabel')} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#d4af37] focus:outline-none transition-colors">
                    {TABLE_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#0e0c12]">{opt}</option>)}
                  </select>
                  {errors.seatLabel && <p className="text-red-400 text-[10px] mt-1">{errors.seatLabel.message}</p>}
                </div>

                {/* Base choice */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1">База для колбы</label>
                  <input type="hidden" {...register('liquidBase')} />
                  <div className="grid grid-cols-2 gap-2">
                    {LIQUID_BASES.map(base => (
                      <button
                        key={base.id} 
                        type="button" 
                        onClick={() => setValue('liquidBase', base.id, { shouldValidate: true })}
                        className={`text-left p-3 rounded-xl border transition-all ${currentLiquidBase === base.id ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/5 hover:border-white/20 bg-white/[0.01]'}`}
                      >
                        <div className="text-xs font-bold text-white">{base.name}</div>
                        <div className="text-[9px] text-[#d4af37] mt-1">{base.price > 0 ? `+${base.price} ₽` : 'Включено'}</div>
                      </button>
                    ))}
                  </div>
                  {errors.liquidBase && <p className="text-red-400 text-[10px] mt-1">{errors.liquidBase.message}</p>}
                </div>

                {/* Custom note */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1">Пожелания к покуру</label>
                  <textarea 
                    {...register('specialNotes')} 
                    placeholder="Например: покислее, полегче, чаша на грейпфруте..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white h-20 resize-none focus:border-[#d4af37] focus:outline-none transition-colors placeholder:text-white/25" 
                  />
                  {errors.specialNotes && <p className="text-red-400 text-[10px] mt-1">{errors.specialNotes.message}</p>}
                </div>

                {/* Form buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmModal(false)} 
                    className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white transition-all duration-300"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89030] text-black font-extrabold text-[10px] uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
                  >
                    {loading ? 'Отправка...' : 'Заказать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
      `}</style>
    </div>
  );
}
