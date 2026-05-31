import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Bell, Sparkles, Users, Radio, Flame, Award } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

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

  const fetchData = async () => {
    try {
      const [postsRes, mixesRes, promosRes, invitationsRes, bookingsRes, tasteStatsRes] = await Promise.allSettled([
        api.get('/api/posts', { params: { limit: 1 } }),
        api.get('/api/mixes'),
        api.get('/api/promos'),
        api.get('/api/invitations'),
        api.get('/api/bookings/all'),
        api.get('/api/bookings/taste-stats'),
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

    return () => {
      socket.off('online:count');
      socket.off('booking:created');
      socket.off('booking:updated');
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

    </div>
  );
}
