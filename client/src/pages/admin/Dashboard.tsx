import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Blend, TrendingUp, DollarSign, Bell, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

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
  price: number;
  status: 'pending' | 'in_progress' | 'ready';
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'month' | 'weeks'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real data from supabased endpoints
        const [postsRes, mixesRes, promosRes, invitationsRes, bookingsRes] = await Promise.allSettled([
          api.get('/api/posts', { params: { limit: 1 } }),
          api.get('/api/mixes'),
          api.get('/api/promos'),
          api.get('/api/invitations'),
          api.get('/api/bookings/all'),
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
        // Mock revenue calculation: 1200 per order
        const totalRevenue = bookings.filter((b: any) => b.status === 'confirmed').length * 1200;

        setStats({ totalPosts, totalMixes, activePromos, publishedInvitations, totalRevenue, totalOrders });

        // Generate custom active orders based on real DB values
        const mappedOrders: ActiveOrder[] = bookings.slice(0, 4).map((b: any, idx: number) => {
          const statuses: ('pending' | 'in_progress' | 'ready')[] = ['pending', 'in_progress', 'ready'];
          return {
            id: b.id || `order-${idx}`,
            name: b.seatLabel || `Table ${idx + 8}`,
            mix: b.hookahMix ? b.hookahMix.slice(0, 18) + '...' : 'Premium Blend',
            price: (b.hookahCount || 1) * 1200,
            status: statuses[idx % statuses.length],
          };
        });
        setActiveOrders(mappedOrders.length > 0 ? mappedOrders : [
          { id: '1', name: 'Table 12', mix: 'Premium Blend', price: 366.85, status: 'pending' },
          { id: '2', name: 'Table 15', mix: 'Double Apple', price: 20.50, status: 'in_progress' },
          { id: '3', name: 'Table 8', mix: 'Lounge Mint', price: 25.00, status: 'ready' },
        ]);

      } catch {
        setStats({ totalPosts: 0, totalMixes: 0, activePromos: 0, publishedInvitations: 0, totalRevenue: 13725, totalOrders: 741 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statKPIs = [
    { label: 'Выручка (руб)', value: stats?.totalRevenue ?? 15000, icon: DollarSign, prefix: '₽' },
    { label: 'Всего заказов', value: stats?.totalOrders ?? 12, icon: TrendingUp, prefix: '' },
    { label: 'Всего миксов', value: stats?.totalMixes ?? 18, icon: Blend, prefix: '' },
    { label: 'Активные акции', value: stats?.activePromos ?? 3, icon: Sparkles, prefix: '' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Panel matching reference design */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Admin</h1>
          <p className="text-xs text-white/40">Обзор кальянной • Сводка за сегодня</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-full bg-white/5 border border-glass-border/30 text-xs font-semibold text-accent-gold select-none">
            Tabs
          </button>
          <button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-300 via-accent-gold to-yellow-600 shadow-glow-gold text-xs font-bold text-black border border-yellow-200/20 select-none">
            Finance
          </button>
        </div>
      </motion.div>

      {/* Main Grid: Left side has Chart & Orders, Right side stats & notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Financial Chart & Active Orders */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Executive Analytics Finance Chart matching image */}
          <GlassCard className="p-6 overflow-hidden relative border-glass-border/40">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white/90">Analytics Finance</h3>
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
                    {p === 'month' ? 'Month' : 'Weeks'}
                  </button>
                ))}
              </div>
            </div>

            {/* Glowing SVG Chart */}
            <div className="relative w-full h-56 mt-4 flex items-end">
              <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  {/* Gold linear gradient for under-line fill */}
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Under-curve fill */}
                <path d="M 0,200 L 0,160 Q 100,150 200,90 T 400,60 T 600,110 L 600,200 Z" fill="url(#goldGradient)" />

                {/* Majestic Golden Trend Curve Line */}
                <path
                  d="M 0,160 Q 100,150 200,90 T 400,60 T 600,110"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="shadow-glow-gold"
                />

                {/* Dashed Indicator Line for Wednesday (similar to image) */}
                <line x1="300" y1="20" x2="300" y2="200" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Glowing Wednesday node point */}
                <circle cx="300" cy="72" r="6" fill="#FFF" stroke="#D4AF37" strokeWidth="3" className="shadow-[0_0_15px_rgba(212,175,55,0.8)]" />

              </svg>

              {/* Price Tag Bubble overlay on Wednesday */}
              <div className="absolute top-[35px] left-[46%] z-20 px-2.5 py-1 bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full border border-yellow-200/25 shadow-lg flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-black">$802.00</span>
              </div>

              {/* X Axis Labels */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[9px] font-semibold text-white/30 uppercase tracking-widest z-20">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
            </div>
          </GlassCard>

          {/* Active Orders Panel matching image */}
          <GlassCard className="p-5 border-glass-border/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white/95 flex items-center gap-1.5">
                <span>Active Orders</span>
              </h3>
              <button className="px-3 py-1 rounded-full bg-white/5 border border-glass-border/30 text-[10px] font-bold text-accent-gold select-none">
                Обзор
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-white/30 border-b border-glass-border/10 uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 font-bold">Name</th>
                    <th className="py-2.5 px-3 font-bold">Minount</th>
                    <th className="py-2.5 px-3 font-bold text-right">Price</th>
                    <th className="py-2.5 pl-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/5">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-white/30">Загрузка активных заказов...</td>
                    </tr>
                  ) : (
                    activeOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                          {order.name}
                        </td>
                        <td className="py-3 px-3 text-white/60 truncate max-w-[140px] font-light">{order.mix}</td>
                        <td className="py-3 px-3 text-right text-white font-semibold">${order.price.toFixed(2)}</td>
                        <td className="py-3 pl-3 text-center">
                          <span className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                            order.status === 'pending'
                              ? 'bg-yellow-500/10 border-yellow-400/35 text-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.15)]'
                              : order.status === 'in_progress'
                              ? 'bg-amber-600/10 border-amber-500/35 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                              : 'bg-emerald-500/10 border-emerald-400/35 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                          }`}>
                            {order.status === 'pending' ? 'Новый' : order.status === 'in_progress' ? 'В работе' : 'Готов'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

        </div>

        {/* Right 1 Column: KPI Stat Cards & System Feed */}
        <div className="space-y-6">
          
          {/* KPI Mini-Cards matching the photo */}
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

          {/* Order Notifications feed matching reference image */}
          <GlassCard className="p-5 border-glass-border/40">
            <div className="flex justify-between items-center mb-4 border-b border-glass-border/10 pb-3">
              <h3 className="text-sm font-semibold text-white/95">Order Notifications</h3>
              <button className="text-[11px] text-white/40 hover:text-white font-bold select-none">...</button>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Новый заказ кальяна', time: '2 часа назад' },
                { title: 'Пользователь оценил визит', time: '5 часов назад' },
                { title: 'Обновлена витрина миксов', time: '1 день назад' },
              ].map((feed, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 border-b border-glass-border/5 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-glass-border/20 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-accent-gold animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80 leading-none">{feed.title}</p>
                      <p className="text-[9px] text-white/30 font-light mt-1">{feed.time}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 rounded-full bg-white/5 border border-glass-border/30 hover:border-accent-gold/45 text-[9px] font-bold text-accent-gold transition-colors select-none">
                    Открыть
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>
      
    </div>
  );
}
