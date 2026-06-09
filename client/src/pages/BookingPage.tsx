import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Flame, 
  Sparkles,
  Pin,
  UtensilsCrossed,
  Sliders,
  ShieldCheck,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { showToast } from '@/components/NotificationToast';

import { GlassCard } from '@/components/ui/GlassCard';

const bookingFormSchema = z.object({
  flavor: z.string().min(1, 'Укажите желаемый вкус или выберите готовый микс ниже'),
  seatLabel: z.string().min(1, 'Укажите стол'),
  strength: z.string().min(1, 'Укажите крепость'),
  liquidBase: z.string().min(1, 'Укажите базу'),
  additives: z.array(z.string()).default([]),
  specialNotes: z.string().max(1000, 'Максимум 1000 символов').optional(),
});

type BookingFormValues = z.input<typeof bookingFormSchema>;

interface Mix {
  id: string;
  name: string;
  description: string;
  strength: number;
  isCustom?: boolean;
  raw?: any;
}

const LIQUID_BASES = [
  { id: 'water', name: 'На воде', price: 0, desc: 'Классическая чистая фильтрация' },
  { id: 'milk', name: 'На молоке', price: 150, desc: 'Плотный сливочный пар' },
  { id: 'juice', name: 'На соке', price: 200, desc: 'Свежие фруктовые ноты' },
  { id: 'wine', name: 'На вине', price: 450, desc: 'Изысканная винная ароматика' },
];

const SEAT_ZONES = [
  { id: '3pc', name: '3 PC', icon: '🖥️', color: 'cyan', seats: ['3PC-1', '3PC-2', '3PC-3'] },
  { id: '5pc600', name: '5 PC 600Hz', icon: '⚡', color: 'red', seats: ['600Hz-1', '600Hz-2', '600Hz-3', '600Hz-4', '600Hz-5'] },
  { id: 'oled', name: 'OLED', icon: '✨', color: 'emerald', seats: ['OLED-1', 'OLED-2', 'OLED-3', 'OLED-4', 'OLED-5'] },
  { id: '11pc', name: '11 PC', icon: '🖥️', color: 'blue', seats: ['11PC-1', '11PC-2', '11PC-3', '11PC-4', '11PC-5', '11PC-6', '11PC-7', '11PC-8', '11PC-9', '11PC-10', '11PC-11'] },
  { id: '4pc', name: '4 PC', icon: '🖥️', color: 'purple', seats: ['4PC-1', '4PC-2', '4PC-3', '4PC-4'] },
  { id: 'bigps', name: 'BIG PS', icon: '🎮', color: 'gold', seats: ['BIG PS'] },
  { id: 'lowps', name: 'LOW PS', icon: '🎮', color: 'amber', seats: ['LOW PS'] },
  { id: 'ps2floor', name: 'PS 2 Этаж', icon: '🎮', color: 'indigo', seats: ['PS 2эт-1', 'PS 2эт-2', 'PS 2эт-3', 'PS 2эт-4'] },
];

const STRENGTH_OPTIONS = [
  { value: 'light', label: 'Легкая (Light)' },
  { value: 'medium', label: 'Средняя (Medium)' },
  { value: 'strong', label: 'Крепкая (Strong)' },
  { value: 'hard', label: 'Экстра (Extra Hard)' },
];

const ADDITIVE_OPTIONS = [
  { id: 'cold', label: 'Холодок' },
  { id: 'fruit', label: 'Фруктовая чаша' },
  { id: 'juice_bowl', label: 'Колба на соке' },
  { id: 'milk_bowl', label: 'Молоко' },
];

export function BookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  
  const [masterCalled, setMasterCalled] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [timeText, setTimeText] = useState('15:00');
  const timerIntervalRef = useRef<any>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      flavor: '',
      seatLabel: '',
      strength: 'medium',
      liquidBase: 'water',
      additives: [],
      specialNotes: '',
    }
  });

  const selectedLiquidBase = watch('liquidBase');
  const selectedAdditives = watch('additives') || [];

  // Calculate dynamic price based on selections
  const currentBaseObj = LIQUID_BASES.find(b => b.id === selectedLiquidBase) || LIQUID_BASES[0];
  const currentAdditivesPrice = selectedAdditives.length * 100; // 100 RUB per additive
  const totalPrice = 1500 + currentBaseObj.price + currentAdditivesPrice;

  useEffect(() => {
    setLoading(true);
    
    // Load local custom mix first if available
    let localCustomMix: Mix | null = null;
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
            raw: {
              flavor: `Сборка ИИ: ${parsed.hookahMix.map((n: string) => `${n} (${parsed.mixPercentages[n]}%)`).join(', ')}`,
              strength: parsed.hookahStrength || 'medium',
              liquidBase: parsed.liquidBase || 'water',
              specialNotes: parsed.comment || '',
              date: new Date().toISOString()
            }
          };
          
          // Prefill form values with saved custom mix
          setValue('flavor', `Сборка ИИ: ${parsed.hookahMix.map((n: string) => `${n} (${parsed.mixPercentages[n]}%)`).join(', ')}`);
          setValue('liquidBase', parsed.liquidBase || 'water');
          setValue('strength', parsed.hookahStrength || 'medium');
          setValue('specialNotes', parsed.comment || '');
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved custom mix:', e);
    }

    const promises: Promise<any>[] = [
      api.get<Mix[]>('/api/mixes').then(res => res.data).catch(() => [])
    ];

    if (isAuthenticated) {
      promises.push(api.get('/api/bookings/my').then(res => res.data).catch(() => []));
      promises.push(api.get('/api/orders/my').then(res => res.data).catch(() => []));
    }

    Promise.all(promises)
      .then(([serverMixes, myBookings = [], myOrders = []]) => {
        let historyMixes: Mix[] = [];
        if (isAuthenticated) {
          // Parse unique custom mixes from history
          const recipesMap = new Map<string, Mix>();

          // 1. Extract from bookings
          myBookings.forEach((b: any, index: number) => {
            if (b.hookahMix && b.hookahMix.trim() && b.hookahMix !== 'Без кальяна (заказ на месте)') {
              const flavor = b.hookahMix.trim();
              const key = `booking-${flavor}`;
              
              let liquidBase = 'water';
              if (flavor.toLowerCase().includes('молок') || flavor.toLowerCase().includes('milk')) liquidBase = 'milk';
              else if (flavor.toLowerCase().includes('сок') || flavor.toLowerCase().includes('juice')) liquidBase = 'juice';
              else if (flavor.toLowerCase().includes('вин') || flavor.toLowerCase().includes('wine')) liquidBase = 'wine';

              const strengthVal = b.hookahStrength || 'medium';
              const strengthNum = strengthVal === 'light' ? 3 : strengthVal === 'medium' ? 6 : 9;

              if (!recipesMap.has(key) || new Date(b.date) > new Date(recipesMap.get(key)!.raw.date)) {
                recipesMap.set(key, {
                  id: `history-booking-${b.id || index}`,
                  name: `Мой микс: ${flavor.length > 25 ? flavor.slice(0, 22) + '...' : flavor}`,
                  description: `Крепость: ${strengthVal === 'light' ? 'Легкая' : strengthVal === 'medium' ? 'Средняя' : 'Крепкая'}, База: ${liquidBase === 'water' ? 'На воде' : liquidBase === 'milk' ? 'На молоке' : liquidBase === 'juice' ? 'На соке' : 'На вине'}.`,
                  strength: strengthNum,
                  isCustom: true,
                  raw: {
                    flavor,
                    strength: strengthVal,
                    liquidBase,
                    specialNotes: b.comment || '',
                    date: b.date
                  }
                });
              }
            }
          });

          // 2. Extract from orders
          myOrders.forEach((o: any, index: number) => {
            if (o.notes && o.notes.trim()) {
              const rawNotes = o.notes.trim();
              let flavor = rawNotes;
              let strengthVal = 'medium';
              let liquidBase = o.liquidId || 'water';
              let specialNotes = '';

              const flavorMatch = rawNotes.match(/\[Вкус:\s*([^\]]+)\]/);
              const strengthMatch = rawNotes.match(/\[Крепость:\s*([^\]]+)\]/);

              if (flavorMatch) {
                flavor = flavorMatch[1];
                const parts = rawNotes.split(/\[[^\]]+\]/);
                specialNotes = parts[parts.length - 1]?.trim() || '';
              }

              if (strengthMatch) {
                strengthVal = strengthMatch[1] || 'medium';
              }

              const key = `order-${flavor}`;
              const strengthNum = strengthVal === 'light' ? 3 : strengthVal === 'medium' ? 6 : 9;

              if (!recipesMap.has(key) || new Date(o.createdAt) > new Date(recipesMap.get(key)!.raw.date)) {
                recipesMap.set(key, {
                  id: `history-order-${o.id || index}`,
                  name: `Мой микс: ${flavor.length > 25 ? flavor.slice(0, 22) + '...' : flavor}`,
                  description: `Крепость: ${strengthVal === 'light' ? 'Легкая' : strengthVal === 'medium' ? 'Средняя' : 'Крепкая'}, База: ${liquidBase === 'water' ? 'На воде' : liquidBase === 'milk' ? 'На молоке' : liquidBase === 'juice' ? 'На соке' : 'На вине'}.`,
                  strength: strengthNum,
                  isCustom: true,
                  raw: {
                    flavor,
                    strength: strengthVal,
                    liquidBase,
                    specialNotes,
                    date: o.createdAt
                  }
                });
              }
            }
          });

          historyMixes = Array.from(recipesMap.values()).sort((a, b) => new Date(b.raw.date).getTime() - new Date(a.raw.date).getTime());
        }

        const serverList = serverMixes || [];
        const combined = [
          ...(localCustomMix ? [localCustomMix] : []),
          ...historyMixes,
          ...serverList
        ];
        setMixes(combined);
      })
      .catch((err) => {
        console.error('Failed to load mixes:', err);
        showToast('Сеть недоступна, показано локальное меню', 'error');
      })
      .finally(() => setLoading(false));

    const savedOrderId = localStorage.getItem('current_order_id');
    if (savedOrderId) {
      fetchOrderStatus(savedOrderId);
    }
  }, [setValue, isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:updated', (data: any) => {
      const savedId = localStorage.getItem('current_order_id');
      if (data && data.id === savedId) {
        setActiveOrder(data);
        if (data.status === 'done' || data.status === 'cancelled') {
          localStorage.removeItem('current_order_id');
          if (data.status === 'done') {
            showToast('Ваш кальян готов! Приятного покура! 💨', 'success');
          }
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

    let pollInterval: any;
    if (activeOrder.status !== 'done' && activeOrder.status !== 'cancelled') {
      pollInterval = setInterval(() => fetchOrderStatus(activeOrder.id), 8000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeOrder]);

  const fetchOrderStatus = (id: string) => {
    api.get(`/api/orders/${id}/status`)
      .then(res => {
        setActiveOrder(res.data);
        if (res.data.status === 'done' || res.data.status === 'cancelled') {
          localStorage.removeItem('current_order_id');
        }
      })
      .catch(() => {
        localStorage.removeItem('current_order_id');
        setActiveOrder(null);
      });
  };

  const handlePrefillFromMix = (mix: Mix) => {
    if (mix.isCustom && mix.raw) {
      setValue('flavor', mix.raw.flavor || '');
      setValue('strength', mix.raw.strength || 'medium');
      setValue('liquidBase', mix.raw.liquidBase || 'water');
      setValue('specialNotes', mix.raw.specialNotes || '');
      showToast(`Выбран сохраненный микс: ${mix.raw.flavor}`, 'success');
    } else {
      setValue('flavor', mix.name === 'Мой рецепт (ИИ-Миксолог)' ? mix.description : mix.name);
      setValue('strength', mix.strength <= 4 ? 'light' : mix.strength <= 7 ? 'medium' : 'strong');
      showToast(`Выбран микс: ${mix.name}`, 'success');
    }
  };

  const onOrderSubmit = async (data: BookingFormValues) => {
    if (!isAuthenticated) {
      showToast('Войдите, чтобы оформить заказ', 'error');
      navigate('/login?redirect=/booking');
      return;
    }
    setLoading(true);
    try {
      const finalNotes = `[Вкус: ${data.flavor}] [Крепость: ${data.strength}] [Добавки: ${(data.additives || []).join(', ')}] ${data.specialNotes || ''}`;

      const res = await api.post('/api/orders', {
        mix_id: null,
        liquid_id: data.liquidBase,
        notes: finalNotes,
        seat_id: data.seatLabel.replace(/\s+/g, '-').toLowerCase(),
        seat_label: data.seatLabel,
        seat_zone: 'hall',
      });
      setActiveOrder(res.data);
      localStorage.setItem('current_order_id', res.data.id);
      showToast('Заказ успешно зарегистрирован!', 'success');
    } catch (err) {
      showToast('Не удалось отправить заказ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCallMaster = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      await api.post(`/api/orders/${activeOrder.id}/request-master`);
      setMasterCalled(true);
      showToast('Мастер вызван к вашему столу', 'success');
    } catch (err) {
      showToast('Ошибка вызова мастера', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (id: string) => {
    const current = watch('additives') || [];
    if (current.includes(id)) {
      setValue('additives', current.filter(x => x !== id));
    } else {
      setValue('additives', [...current, id]);
    }
  };

  const stages = [
    { id: 'accepted', label: 'Принят', desc: 'Заказ зарегистрирован' },
    { id: 'preparing', label: 'Подготовка', desc: 'Сборка микса и забивка чаши' },
    { id: 'roasting', label: 'Прогрев', desc: 'Разогрев углей' },
    { id: 'delivering', label: 'Подача', desc: 'Вынос кальяна к столу' },
    { id: 'done', label: 'Подан', desc: 'Кальян готов, приятного покура!' },
  ];

  return (
    <div className="space-y-12 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-8 text-center md:text-left select-none pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-gold/20 bg-accent-gold/5 text-[10px] font-semibold text-accent-gold uppercase tracking-[0.2em] mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Premium Hookah Service
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-light text-white uppercase tracking-wider leading-none">
          Заказ <span className="gradient-text font-semibold italic">кальяна</span>
        </h1>
        <p className="text-xs text-white/50 mt-2 font-light max-w-xl">
          Выберите свой идеальный микс. Мы создаем искусство дыма, учитывая каждое ваше пожелание по вкусу, крепости и колбе.
        </p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Left Side: Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onOrderSubmit)} className="liquid-glass p-4 sm:p-6 rounded-cyber border border-white/10 glow-box relative overflow-hidden space-y-6">
            <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#ffbf00_0%,transparent_70%)] pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Taste/Flavor Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-accent-gold font-bold flex items-center gap-1.5" htmlFor="flavor">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Вкус
                </label>
                <div className="relative rounded-xl bg-black/40 border border-white/10 focus-within:border-accent-gold transition-colors flex items-center">
                  <span className="absolute left-4 text-white/30 text-sm">🍓</span>
                  <input
                    id="flavor"
                    type="text"
                    {...register('flavor')}
                    placeholder="Например: Сладкие ягоды с мятой или выберите микс ниже"
                    className="w-full bg-transparent border-none text-xs text-white placeholder-white/20 pl-11 pr-4 py-3.5 focus:ring-0 focus:outline-none"
                  />
                </div>
                {errors.flavor && <p className="text-red-400 text-[10px]">{errors.flavor.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strength Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-accent-gold font-bold flex items-center gap-1.5" htmlFor="strength">
                    <Sliders className="w-3.5 h-3.5" /> Крепость
                  </label>
                  <select
                    id="strength"
                    {...register('strength')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:border-accent-gold focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {STRENGTH_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-[#131313]">{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Seat/Zone Choice */}
                <div className="space-y-1.5 col-span-full">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-accent-gold font-bold flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5" /> Выберите зону и место
                  </label>
                  {/* Zone selector */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {SEAT_ZONES.map(zone => {
                      const isActive = selectedZone === zone.id;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => {
                            setSelectedZone(zone.id);
                            if (zone.seats.length === 1) {
                              setValue('seatLabel', zone.seats[0], { shouldValidate: true });
                            } else {
                              setValue('seatLabel', '', { shouldValidate: false });
                            }
                          }}
                          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center transition-all ${isActive
                            ? 'border-accent-gold bg-accent-gold/10 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <span className="text-base leading-none">{zone.icon}</span>
                          <span className={`text-[9px] font-bold leading-tight ${isActive ? 'text-accent-gold' : 'text-white/60'}`}>{zone.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Seat selector inside zone */}
                  {selectedZone && (() => {
                    const zone = SEAT_ZONES.find(z => z.id === selectedZone);
                    if (!zone || zone.seats.length <= 1) return null;
                    return (
                      <div className="mt-2 p-3 rounded-xl bg-black/30 border border-white/5">
                        <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold mb-2">Место в зоне {zone.name}:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {zone.seats.map(seat => {
                            const num = seat.split('-').pop();
                            const isSelected = watch('seatLabel') === seat;
                            return (
                              <button
                                key={seat}
                                type="button"
                                onClick={() => setValue('seatLabel', seat, { shouldValidate: true })}
                                className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${isSelected
                                  ? 'border-accent-gold bg-accent-gold/20 text-accent-gold shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                                  : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  {errors.seatLabel && <p className="text-red-400 text-[10px]">{errors.seatLabel.message}</p>}
                  <input type="hidden" {...register('seatLabel')} />
                </div>
              </div>

              {/* Liquid Base choice */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] uppercase tracking-[0.15em] text-accent-gold font-bold">База для колбы</label>
                <div className="grid grid-cols-2 gap-2">
                  {LIQUID_BASES.map(base => (
                    <button
                      key={base.id} 
                      type="button" 
                      onClick={() => setValue('liquidBase', base.id, { shouldValidate: true })}
                      className={`text-left p-3 rounded-xl border transition-all ${selectedLiquidBase === base.id ? 'border-accent-gold bg-accent-gold/5' : 'border-white/5 hover:border-white/20 bg-white/[0.01]'}`}
                    >
                      <div className="text-xs font-bold text-white">{base.name}</div>
                      <div className="text-[9px] text-[#d4af37] mt-0.5">{base.price > 0 ? `+${base.price} ₽` : 'Включено'}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additives Section */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase tracking-[0.15em] text-accent-gold font-bold">Добавки</span>
                <div className="grid grid-cols-2 gap-3">
                  {ADDITIVE_OPTIONS.map(opt => {
                    const checked = selectedAdditives.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleCheckboxChange(opt.id)}
                        className={`px-4 py-3 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          checked
                            ? 'bg-accent-gold/15 border-accent-gold text-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.1)]'
                            : 'bg-black/40 border-white/5 text-white/60 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-bold text-accent-gold">
                          {checked ? '✓' : '+100₽'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-accent-gold font-bold" htmlFor="specialNotes">Примечания к заказу</label>
                <textarea
                  id="specialNotes"
                  {...register('specialNotes')}
                  placeholder="Особые пожелания к кальянному мастеру..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white h-20 resize-none focus:border-accent-gold focus:outline-none transition-colors placeholder:text-white/20"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs font-bold text-white">
                <span>Предварительная стоимость:</span>
                <span className="text-sm text-accent-gold">{totalPrice} ₽</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end relative z-10">
              {isAuthenticated ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent-gold text-black font-extrabold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(255,191,0,0.3)]"
                >
                  {loading ? 'Отправка...' : 'Заказать сейчас'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/booking')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent-gold text-black font-extrabold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(255,191,0,0.3)]"
                >
                  Войти и заказать
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Active Order / Tracker or 3D Preview */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {!activeOrder ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Premium Preview */}
                <GlassCard className="p-6 flex flex-col items-center justify-center border-accent-gold/20 bg-[#131313]/90 relative overflow-hidden select-none">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffbf00_0%,transparent_70%)]" />
                  <div className="text-center space-y-3 relative z-10 py-6">
                    <span className="text-5xl">💨</span>
                    <h3 className="text-lg font-display font-light text-white uppercase tracking-wider">Stealth <span className="text-accent-gold font-semibold italic">Obsidian</span></h3>
                    <p className="text-[11px] text-white/50 leading-relaxed font-light max-w-xs mx-auto">Наша фирменная модель из матового чёрного стекла с золотыми акцентами — идеальный баланс густоты и вкуса.</p>
                  </div>
                </GlassCard>

                {/* Art of Smoke Promos */}
                <GlassCard className="p-6 border-accent-gold/20 relative overflow-hidden min-h-[160px] flex flex-col justify-end">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,_#ffbf00_0%,transparent_70%)]"></div>
                  <div className="space-y-2 relative z-10">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-accent-gold font-bold block glow-text">Premium Experience</span>
                    <h3 className="text-xl font-display font-light text-white uppercase tracking-wider glow-text">Art of Smoke</h3>
                    <p className="text-[11px] text-white/50 leading-relaxed font-light">Наши мастера используют только премиальные табаки и аксессуары для обеспечения идеальной вкусопередачи и густоты пара.</p>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 rounded-3xl bg-[#120e1a]/60 border border-accent-gold/20 relative overflow-hidden backdrop-blur-md glow-box"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,191,0,0.08),transparent_70%)] pointer-events-none"></div>

                {/* Close Button to hide/reset tracker */}
                <button
                  onClick={() => {
                    localStorage.removeItem('current_order_id');
                    setActiveOrder(null);
                    setMasterCalled(false);
                  }}
                  className="absolute top-4 right-4 text-white/45 hover:text-white transition-colors cursor-pointer z-20"
                  title="Сбросить / скрыть трекер"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative z-10 flex flex-col">
                  {/* Timer & Table info */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
                    <div>
                      <p className="text-[9px] text-accent-gold uppercase tracking-wider font-semibold mb-1">Приблизительное время подачи</p>
                      <h4 className="text-3xl font-mono font-bold tracking-tight text-white">{timeText}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-1">Ваш Стол</p>
                      <p className="text-xs font-bold text-accent-gold uppercase bg-accent-gold/10 px-2.5 py-1 rounded-lg border border-accent-gold/20">{activeOrder.seatLabel}</p>
                    </div>
                  </div>

                  {/* Stepper progress */}
                  <div className="relative pl-3 space-y-6">
                    {/* Vertical line connector */}
                    <div className="absolute left-[20px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-accent-gold to-white/10"></div>
                    
                    {stages.map((stage, idx) => {
                      const stagesList = stages.map(s => s.id);
                      const currentIdx = stagesList.indexOf(activeOrder.status);
                      const targetIdx = idx;
                      const isCompleted = currentIdx > targetIdx;
                      const isActive = currentIdx === targetIdx;
                      
                      return (
                        <div key={stage.id} className={`flex items-start gap-4 relative transition-all duration-300 ${isCompleted || isActive ? 'opacity-100' : 'opacity-25'}`}>
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-[#0e0e0e] z-10 ${isActive ? 'border-accent-gold text-accent-gold shadow-[0_0_15px_rgba(255,191,0,0.4)]' : isCompleted ? 'border-accent-gold text-accent-gold' : 'border-white/10 text-white/20'}`}>
                            {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-accent-gold animate-pulse' : 'bg-transparent'}`}></div>}
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
                    className="mt-8 w-full py-3.5 rounded-xl border border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/15 disabled:bg-white/5 disabled:border-white/10 text-[10px] font-bold text-accent-gold disabled:text-white/30 uppercase tracking-[0.15em] transition-all duration-300"
                  >
                    {masterCalled ? 'Вызов отправлен' : 'Позвать кальянного мастера'}
                  </button>

                  {(activeOrder.status === 'done' || activeOrder.status === 'cancelled') && (
                    <button 
                      onClick={() => {
                        localStorage.removeItem('current_order_id');
                        setActiveOrder(null);
                        setMasterCalled(false);
                      }}
                      className="mt-3 w-full py-3.5 rounded-xl bg-accent-gold text-black hover:brightness-110 text-[10px] font-extrabold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer"
                    >
                      Оформить новый заказ
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standards Info Card */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-semibold border-b border-white/5 pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent-gold" /> Наши Стандарты
            </h3>
            <ul className="space-y-3.5 text-xs text-white/70">
              <li className="flex items-center gap-2.5">
                <span className="text-accent-gold">✓</span> Премиальные сертифицированные бренды табака
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-accent-gold">✓</span> Полная дезинфекция шахты, шлангов и мундштуков
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-accent-gold">✓</span> Регулярный контроль жара и смена углей мастером
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* Available mixes list */}
      <section className="space-y-6 pt-4 select-none">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-accent-gold">Или выберите готовый рецепт</h2>
          <span className="text-xs text-white/40">{mixes.length} рецептов</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mixes.map((mix) => (
            <motion.div
              key={mix.id}
              whileHover={{ y: -3 }}
              onClick={() => handlePrefillFromMix(mix)}
              className="p-5 rounded-2xl bg-glass-bg border border-glass-border/30 hover:border-accent-gold/30 hover:glow-box transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center border border-accent-gold/25">
                    <Flame className="w-4 h-4 text-accent-gold" />
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    {mix.isCustom && (
                      <span className="text-[8px] uppercase tracking-wider bg-accent-gold/20 text-accent-gold px-1.5 py-0.5 rounded font-bold">
                        История
                      </span>
                    )}
                    <span className="text-[9px] uppercase tracking-wider bg-white/5 text-accent-gold px-2 py-0.5 rounded font-mono font-bold">
                      Крепость: {mix.strength}/10
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-white">{mix.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed font-light line-clamp-2">{mix.description}</p>
              </div>
              <div className="text-right pt-3">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider group-hover:text-white">Выбрать рецепт →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
export default BookingPage;
