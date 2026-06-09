import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Bell, Sparkles, Users, Radio, Flame, Award, Plus, Trash2, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { HOOKAH_FLAVORS, FLAVOR_CATEGORIES } from '@/config/seats';

function FlavorManagement() {
  const [flavors, setFlavors] = useState(HOOKAH_FLAVORS);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newCategory, setNewCategory] = useState('Фрукты');
  const [filterCat, setFilterCat] = useState('Все');

  const handleAdd = () => {
    if (!newName.trim() || !newEmoji.trim()) return;
    const newFlavor = { name: newName.trim(), emoji: newEmoji.trim(), category: newCategory };
    setFlavors(prev => [...prev, newFlavor]);
    setNewName('');
    setNewEmoji('');
  };

  const handleRemove = (name: string) => {
    setFlavors(prev => prev.filter(f => f.name !== name));
  };

  const cats = FLAVOR_CATEGORIES;
  const filtered = filterCat === 'Все' ? flavors : flavors.filter(f => f.category === filterCat);

  return (
    <GlassCard className="p-6 border-glass-border/40">
      <h3 className="text-md font-display font-semibold text-white tracking-wide flex items-center gap-2 mb-4 border-b border-glass-border/10 pb-3">
        <Flame className="w-5 h-5 text-accent-gold" />
        <span>Управление ассортиментом вкусов</span>
        <span className="ml-auto text-[10px] font-normal text-white/30">{flavors.length} вкусов</span>
      </h3>

      {/* Add new flavor */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-black/20 border border-white/5">
        <input
          value={newEmoji}
          onChange={e => setNewEmoji(e.target.value)}
          placeholder="😋"
          className="w-12 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-center text-sm text-white focus:border-accent-gold focus:outline-none"
          maxLength={4}
        />
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Название вкуса"
          className="flex-1 min-w-[140px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-accent-gold focus:outline-none"
        />
        <select
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-accent-gold focus:outline-none"
        >
          {cats.filter(c => c !== 'Все').map(c => (
            <option key={c} value={c} className="bg-[#131313]">{c}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || !newEmoji.trim()}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent-gold/20 border border-accent-gold/30 text-accent-gold text-xs font-bold hover:bg-accent-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-3 pb-1">
        {cats.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              filterCat === cat
                ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
                : 'bg-white/[0.03] text-white/40 border border-transparent hover:text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Flavor list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide">
        {filtered.map(flavor => (
          <div
            key={flavor.name}
            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 group transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">{flavor.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs text-white/80 font-medium truncate">{flavor.name}</p>
                <p className="text-[9px] text-white/30">{flavor.category}</p>
              </div>
            </div>
            <button
              onClick={() => handleRemove(flavor.name)}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              title="Удалить"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
interface Stats {
  totalPosts: number;
  totalMixes: number;
  activePromos: number;
  publishedInvitations: number;
  totalRevenue: number;
  totalOrders: number;
}

interface ActiveOrder {
  id: string;
  name: string;
  mix: string;
  strength: string;
  price: number;
  status: 'accepted' | 'heating' | 'almost' | 'ready';
}

interface TasteStats {
  totalAnalyzed: number;
  totalUsers: number;
  mixes: { name: string; count: number }[];
  strengths: { light: number; medium: number; strong: number };
  users: { id: string; name: string; email: string; totalOrders: number; favoriteMix: string }[];
}

function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    const startValue = displayValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * eased));

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);

    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString('ru-RU')}</span>;
}

export function Dashboard() {
  const { socket } = useSocket();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'month' | 'weeks'>('month');

  // Real-time online states
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState<{ userId?: string; name?: string; role?: string }[]>([]);

  // Taste analytics state
  const [tasteStats, setTasteStats] = useState<TasteStats | null>(null);

  // Hookah calendar stats states
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const fetchData = async () => {
    try {
      const [postsRes, mixesRes, promosRes, invitationsRes, bookingsRes, tasteStatsRes, ordersRes] = await Promise.allSettled([
        api.get('/api/posts', { params: { limit: 1 } }),
        api.get('/api/mixes'),
        api.get('/api/promos'),
        api.get('/api/invitations'),
        api.get('/api/bookings/all'),
        api.get('/api/bookings/taste-stats'),
        api.get('/api/orders')
      ]);

      const totalPosts = postsRes.status === 'fulfilled'
        ? (postsRes.value.data.total ?? postsRes.value.data.posts?.length ?? 0)
        : 0;
      const totalMixes = mixesRes.status === 'fulfilled'
        ? (Array.isArray(mixesRes.value.data) ? mixesRes.value.data.length : 0)
        : 0;
      const activePromos = promosRes.status === 'fulfilled'
        ? (Array.isArray(promosRes.value.data) ? promosRes.value.data.length : 0)
        : 0;
      const publishedInvitations = invitationsRes.status === 'fulfilled'
        ? (Array.isArray(invitationsRes.value.data) ? invitationsRes.value.data.length : 0)
        : 0;

      const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.data : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];
      setBookingsData(bookings);
      setOrdersData(orders);

      const totalOrders = bookings.length;
      const totalRevenue = bookings.filter((b: any) => b.status === 'confirmed').length * 1200;

      setStats({ totalPosts, totalMixes, activePromos, publishedInvitations, totalRevenue, totalOrders });

      if (tasteStatsRes.status === 'fulfilled') {
        setTasteStats(tasteStatsRes.value.data);
      }

      // Filter active orders (confirmed bookings where hookah is not yet ready)
      const activeBookings = bookings.filter((b: any) => b.status === 'confirmed' && b.hookahStatus !== 'ready');
      const mappedOrders: ActiveOrder[] = activeBookings.map((b: any) => ({
        id: b.id,
        name: b.seatLabel || 'Стол',
        mix: b.hookahMix || 'Премиум смесь',
        strength: b.hookahStrength || 'medium',
        price: (b.hookahCount || 1) * 1200,
        status: b.hookahStatus || 'accepted',
      }));
      setActiveOrders(mappedOrders);

    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!socket) return;

    socket.on('online:count', (data: { count: number; users: any[] }) => {
      setOnlineCount(data.count);
      setOnlineUsers(data.users || []);
    });

    const playChime = () => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
      audio.volume = 0.35;
      audio.play().catch((e) => console.log('Chime failed to play:', e.message));
    };

    socket.on('booking:created', () => {
      fetchData();
      playChime();
    });

    socket.on('booking:updated', () => {
      fetchData();
    });

    socket.on('order:created', () => {
      fetchData();
      playChime();
    });

    socket.on('order:updated', () => {
      fetchData();
    });

    return () => {
      socket.off('online:count');
      socket.off('booking:created');
      socket.off('booking:updated');
      socket.off('order:created');
      socket.off('order:updated');
    };
  }, [socket]);

  const advanceHookahStatus = async (orderId: string, currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      accepted: 'heating',
      heating: 'almost',
      almost: 'ready',
    };
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    try {
      await api.put(`/api/bookings/${orderId}/hookah-status`, { hookahStatus: nextStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to update hookah status:', err);
    }
  };

  const statKPIs = [
    { label: 'Выручка (руб)', value: stats?.totalRevenue ?? 0, icon: DollarSign, prefix: '₽' },
    { label: 'Всего заказов', value: stats?.totalOrders ?? 0, icon: TrendingUp, prefix: '' },
    { label: 'Клиентская база', value: tasteStats?.totalUsers ?? 0, icon: Users, prefix: '' },
    { label: 'Активные акции', value: stats?.activePromos ?? 0, icon: Sparkles, prefix: '' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Panel */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Панель управления</h1>
          <p className="text-xs text-white/40">Обзор заведения • Интерактивный пульт администратора</p>
        </div>
        <div className="flex gap-2">
          {/* Live indicator tag */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Соединение Live</span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Finance & Live shisha queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Financial Chart & Active Orders Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Executive Analytics Finance Chart */}
          <GlassCard className="p-6 overflow-hidden relative border-glass-border/40">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white/90">Статистика выручки</h3>
                <p className="text-[10px] text-white/35">Движение выручки за текущий цикл</p>
              </div>
              <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-glass-border/30">
                {(['month', 'weeks'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                      chartPeriod === p 
                        ? 'bg-accent-gold text-black border border-accent-gold/25' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {p === 'month' ? 'Месяц' : 'Недели'}
                  </button>
                ))}
              </div>
            </div>

            {/* Glowing SVG Chart */}
            <div className="relative w-full h-52 mt-4 flex items-end">
              <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                <path d="M 0,200 L 0,160 Q 100,150 200,90 T 400,60 T 600,110 L 600,200 Z" fill="url(#goldGradient)" />
                <path
                  d="M 0,160 Q 100,150 200,90 T 400,60 T 600,110"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                <line x1="300" y1="20" x2="300" y2="200" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="300" cy="72" r="6" fill="#FFF" stroke="#D4AF37" strokeWidth="3" className="shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
              </svg>

              <div className="absolute top-[35px] left-[46%] z-20 px-2.5 py-1 bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full border border-yellow-200/25 shadow-lg flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-black">802.00 ₽</span>
              </div>

              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[9px] font-semibold text-white/30 uppercase tracking-widest z-20">
                <span>Пн</span>
                <span>Вт</span>
                <span>Ср</span>
                <span>Чт</span>
                <span>Пт</span>
                <span>Сб</span>
              </div>
            </div>
          </GlassCard>

          {/* Active Shisha Queue Panel */}
          <GlassCard className="p-5 border-glass-border/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white/95 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-accent-gold" />
                <span>Очередь приготовления кальянов</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-accent-gold/15 border border-accent-gold/25 text-[9px] font-bold text-accent-gold">
                {activeOrders.length} в очереди
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-white/30 border-b border-glass-border/10 uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 font-bold">Стол</th>
                    <th className="py-2.5 px-3 font-bold">Выбранный микс</th>
                    <th className="py-2.5 px-3 font-bold">Крепость</th>
                    <th className="py-2.5 px-3 font-bold text-right">Стоимость</th>
                    <th className="py-2.5 pl-3 font-bold text-center">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/30">Загрузка очереди кальянов...</td>
                    </tr>
                  ) : activeOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/20 font-light">Активных заказов нет. Все кальяны готовы! 💨</td>
                    </tr>
                  ) : (
                    activeOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 text-white font-medium flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            order.status === 'accepted' ? 'bg-blue-400' : order.status === 'heating' ? 'bg-yellow-500 animate-pulse' : 'bg-orange-500 animate-bounce'
                          }`} />
                          {order.name}
                        </td>
                        <td className="py-3.5 px-3 text-white/70 truncate max-w-[160px] font-light">{order.mix}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            order.strength === 'strong' 
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                              : order.strength === 'medium'
                              ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                              : 'bg-green-500/10 border border-green-500/30 text-green-400'
                          }`}>
                            {order.strength === 'strong' ? 'Крепкий' : order.strength === 'medium' ? 'Средний' : 'Легкий'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right text-white font-semibold">{order.price} ₽</td>
                        <td className="py-3.5 pl-3 text-center">
                          <button
                            onClick={() => advanceHookahStatus(order.id, order.status)}
                            className="px-3.5 py-1 rounded-full border border-accent-gold/45 hover:bg-accent-gold hover:text-black font-semibold text-[10px] text-accent-gold transition-all"
                          >
                            {order.status === 'accepted' && 'Начать прогрев (угли)'}
                            {order.status === 'heating' && 'Почти готово'}
                            {order.status === 'almost' && 'Готов к выдаче! 🔥'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Visual Hookah Calendar Stats */}
          {(() => {
            const monthNames = [
              'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
              'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ];

            const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
            const getFirstDayOfMonth = (year: number, month: number) => {
              const day = new Date(year, month, 1).getDay();
              return day === 0 ? 6 : day - 1; // 0 = Mon, 6 = Sun
            };

            const getHookahEvents = () => {
              const events: Record<string, number> = {};

              // 1. Process bookings
              bookingsData.forEach((b: any) => {
                if (b.status !== 'cancelled' && b.hookahMix && b.hookahMix !== 'Без кальяна (заказ на месте)') {
                  const count = b.hookahCount || 1;
                  const dateStr = b.date;
                  if (dateStr) {
                    events[dateStr] = (events[dateStr] || 0) + count;
                  }
                }
              });

              // 2. Process orders
              ordersData.forEach((o: any) => {
                if (o.status !== 'cancelled') {
                  const dateStr = o.createdAt ? o.createdAt.split('T')[0] : '';
                  if (dateStr) {
                    events[dateStr] = (events[dateStr] || 0) + 1;
                  }
                }
              });

              return events;
            };

            const hookahEvents = getHookahEvents();

            // Calculate aggregates
            const todayStr = new Date().toISOString().split('T')[0];
            let todayCount = 0;
            let weekCount = 0;
            let monthCount = 0;

            const nowTime = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            Object.entries(hookahEvents).forEach(([dateStr, count]) => {
              const dateVal = new Date(dateStr);
              const diffDays = Math.floor((nowTime - dateVal.getTime()) / oneDay);

              if (dateStr === todayStr) {
                todayCount += count;
              }
              if (diffDays >= 0 && diffDays < 7) {
                weekCount += count;
              }
              if (diffDays >= 0 && diffDays < 30) {
                monthCount += count;
              }
            });

            const daysInMonth = getDaysInMonth(calYear, calMonth);
            const firstDay = getFirstDayOfMonth(calYear, calMonth);
            const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

            for (let i = 0; i < firstDay; i++) {
              cells.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
            }

            for (let d = 1; d <= daysInMonth; d++) {
              const mm = (calMonth + 1).toString().padStart(2, '0');
              const dd = d.toString().padStart(2, '0');
              const dateStr = `${calYear}-${mm}-${dd}`;
              cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
            }

            return (
              <GlassCard className="p-6 border-glass-border/40 mt-6 select-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,rgba(255,191,0,0.04),transparent_70%)] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2">
                      <Calendar className="w-4.5 h-4.5 text-accent-gold" />
                      <span>Календарь заказов кальянов</span>
                    </h3>
                    <p className="text-[10px] text-white/35">Дневная активность забивок и заказов на месте</p>
                  </div>

                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear(y => y - 1);
                        } else {
                          setCalMonth(m => m - 1);
                        }
                      }}
                      className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white transition-colors text-[10px] font-bold"
                    >
                      ◀
                    </button>
                    <span className="text-xs font-bold text-white min-w-[90px] text-center">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    <button
                      onClick={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear(y => y + 1);
                        } else {
                          setCalMonth(m => m + 1);
                        }
                      }}
                      className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white transition-colors text-[10px] font-bold"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] uppercase tracking-wider font-extrabold text-white/35 mb-3">
                  <span>Пн</span>
                  <span>Вт</span>
                  <span>Ср</span>
                  <span>Чт</span>
                  <span>Пт</span>
                  <span>Сб</span>
                  <span>Вс</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {cells.map((cell, idx) => {
                    if (!cell.isCurrentMonth) {
                      return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg" />;
                    }

                    const count = hookahEvents[cell.dateStr] || 0;
                    let bgStyle = 'bg-white/[0.01] border-white/5 text-white/40';
                    let glowStyle = '';

                    if (count > 0) {
                      if (count <= 2) {
                        bgStyle = 'bg-amber-500/10 border-accent-gold/20 text-accent-gold';
                        glowStyle = 'shadow-[0_0_8px_rgba(255,191,0,0.1)]';
                      } else if (count <= 5) {
                        bgStyle = 'bg-accent-gold text-black font-extrabold border-accent-gold';
                        glowStyle = 'shadow-[0_0_12px_rgba(255,191,0,0.3)]';
                      } else {
                        bgStyle = 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black font-black border-yellow-300';
                        glowStyle = 'shadow-[0_0_18px_rgba(255,191,0,0.5)] animate-pulse';
                      }
                    }

                    return (
                      <div
                        key={cell.dateStr}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative group transition-all duration-300 ${bgStyle} ${glowStyle}`}
                      >
                        <span className="text-[10px] font-bold">{cell.dayNum}</span>
                        {count > 0 && (
                          <span className="text-[8px] font-mono leading-none mt-0.5 opacity-80">
                            {count}💨
                          </span>
                        )}

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 opacity-0 pointer-events-none group-hover:opacity-100 bg-[#0e0e0e] border border-white/10 px-2 py-1 rounded-md text-[9px] font-medium text-white whitespace-nowrap z-30 shadow-lg transition-opacity">
                          {cell.dayNum} {monthNames[calMonth].slice(0, 3)}: {count} кальянов
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/5 text-center">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] uppercase tracking-wider text-white/45 font-bold mb-0.5">Сегодня</p>
                    <p className="text-base font-extrabold text-accent-gold">{todayCount} 💨</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] uppercase tracking-wider text-white/45 font-bold mb-0.5">Неделя (7 дней)</p>
                    <p className="text-base font-extrabold text-white">{weekCount} 💨</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] uppercase tracking-wider text-white/45 font-bold mb-0.5">Месяц (30 дней)</p>
                    <p className="text-base font-extrabold text-white">{monthCount} 💨</p>
                  </div>
                </div>
              </GlassCard>
            );
          })()}

        </div>

        {/* Right 1 Column: KPIs & Live Online Activity */}
        <div className="space-y-6">
          
          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {statKPIs.map((kpi, idx) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <GlassCard className="p-4 flex flex-col justify-between hover:border-accent-gold/25 transition-all group border-glass-border/30">
                    <div className="w-8 h-8 rounded-lg bg-accent-gold/10 flex items-center justify-center mb-3 border border-accent-gold/20 shadow-md group-hover:shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                      <kpi.icon className="w-4 h-4 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-display font-semibold text-white leading-none">
                        <AnimatedCounter value={kpi.value} prefix={kpi.prefix} />
                      </p>
                      <p className="text-[10px] text-white/35 mt-1 font-semibold uppercase tracking-wider">{kpi.label}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}

          {/* Live Online Activity Card */}
          <GlassCard className="p-5 border-glass-border/40">
            <div className="flex justify-between items-center mb-3 border-b border-glass-border/10 pb-3">
              <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2">
                <Users className="w-4 h-4 text-accent-gold" />
                <span>Активность онлайн</span>
              </h3>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">Активных вкладок / сессий:</span>
                <span className="text-sm font-bold text-white">{onlineCount}</span>
              </div>

              {/* List of registered users online */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Зарегистрированные пользователи:</p>
                {onlineUsers.length === 0 ? (
                  <p className="text-xs text-white/20 italic">Нет авторизованных гостей в сети</p>
                ) : (
                  onlineUsers.map((u, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded border border-glass-border/10">
                      <span className="text-xs text-white/80 font-medium">{u.name}</span>
                      <span className="text-[9px] font-bold text-accent-gold uppercase tracking-widest">{u.role === 'admin' ? 'Админ' : 'Гость'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>

          {/* System notification log */}
          <GlassCard className="p-5 border-glass-border/40">
            <div className="flex justify-between items-center mb-3 border-b border-glass-border/10 pb-3">
              <h3 className="text-sm font-semibold text-white/95">События</h3>
            </div>

            <div className="space-y-3.5">
              {[
                { title: 'Поступил новый заказ кальяна', time: 'Недавно' },
                { title: 'Бот поддержки обработал запрос', time: '10 мин назад' },
                { title: 'Успешно обновлена витрина товаров', time: '1 день назад' },
              ].map((feed, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 border-b border-glass-border/5 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-glass-border/20 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-3.5 h-3.5 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-white/80 font-medium leading-none">{feed.title}</p>
                      <p className="text-[9px] text-white/30 font-light mt-1">{feed.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>

      {/* NEW section: Hookah Taste Choices Analytics (Breakdown panel) */}
      <GlassCard className="p-6 border-glass-border/40">
        <h3 className="text-md font-display font-semibold text-white tracking-wide flex items-center gap-2 mb-4 border-b border-glass-border/10 pb-3">
          <Award className="w-5 h-5 text-accent-gold" />
          <span>Аналитика вкусовых предпочтений гостей</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Top Mixes Rankings */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/35">Популярные вкусы / миксы</h4>
            {loading ? (
              <p className="text-xs text-white/30">Загрузка статистики вкусов...</p>
            ) : !tasteStats || tasteStats.mixes.length === 0 ? (
              <p className="text-xs text-white/20 italic">Нет достаточного количества данных</p>
            ) : (
              <div className="space-y-2">
                {tasteStats.mixes.slice(0, 5).map((m, idx) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-accent-gold font-bold">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/80 truncate max-w-[180px]">{m.name}</span>
                        <span className="text-white font-bold">{m.count} раз</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
                          style={{ width: `${Math.min(100, (m.count / (tasteStats.mixes[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hookah Strengths distribution */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/35">Распределение крепости</h4>
            {loading ? (
              <p className="text-xs text-white/30">Загрузка распределения...</p>
            ) : !tasteStats ? (
              <p className="text-xs text-white/20 italic">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Легкий (light)', value: tasteStats.strengths.light, color: 'bg-green-400' },
                  { label: 'Средний (medium)', value: tasteStats.strengths.medium, color: 'bg-orange-400' },
                  { label: 'Крепкий (strong)', value: tasteStats.strengths.strong, color: 'bg-red-400' },
                ].map(item => {
                  const total = (tasteStats.strengths.light + tasteStats.strengths.medium + tasteStats.strengths.strong) || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">{item.label}</span>
                        <span className="text-white font-semibold">{item.value} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Favorite Mixes leaderboard */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/35">Активные гости и их предпочтения</h4>
            <div className="max-h-52 overflow-y-auto pr-1">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="text-white/30 border-b border-glass-border/10 font-bold tracking-wider">
                    <th className="pb-2">Имя</th>
                    <th className="pb-2 text-center">Заказов</th>
                    <th className="pb-2 text-right">Любимый микс</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/5">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="py-2 text-center text-white/30">Загрузка...</td>
                    </tr>
                  ) : !tasteStats || tasteStats.users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-2 text-center text-white/20 italic">Нет зарегистрированной активности</td>
                    </tr>
                  ) : (
                    tasteStats.users.slice(0, 5).map(u => (
                      <tr key={u.id}>
                        <td className="py-2 text-white/80 font-medium truncate max-w-[100px]">{u.name}</td>
                        <td className="py-2 text-center text-white font-semibold">{u.totalOrders}</td>
                        <td className="py-2 text-right text-accent-gold truncate max-w-[120px]">{u.favoriteMix}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </GlassCard>

      {/* Flavor Management Panel */}
      <FlavorManagement />

    </div>
  );
}
