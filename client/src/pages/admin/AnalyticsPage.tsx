import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingDown, DollarSign, Flame,
  AlertTriangle, Package, Settings, Save, Percent, Repeat, Brain,
  Sparkles, Calendar
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { Booking } from '@/types';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  items: Array<{ name: string; qty: number; price: number }>;
  createdAt: string;
}

interface InventoryItem {
  name: string; currentStock: number; minStock: number; unit: string; pricePerUnit: number; dailyUsage: number;
}

interface ExpenseItem {
  label: string; amount: number;
}

const STORAGE_KEY = 'analytics_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveSettings(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const defaultExpenses: ExpenseItem[] = [
  { label: 'Аренда', amount: 80000 },
  { label: 'Зарплаты', amount: 120000 },
  { label: 'Коммунальные', amount: 15000 },
  { label: 'Прочее', amount: 10000 },
];

const defaultInventory: InventoryItem[] = [
  { name: 'Табак (50г пачка)', currentStock: 45, minStock: 15, unit: 'шт', pricePerUnit: 350, dailyUsage: 6 },
  { name: 'Уголь (коробка 72шт)', currentStock: 12, minStock: 5, unit: 'шт', pricePerUnit: 450, dailyUsage: 2 },
  { name: 'Мундштуки', currentStock: 200, minStock: 50, unit: 'шт', pricePerUnit: 15, dailyUsage: 20 },
  { name: 'Фольга (рулон)', currentStock: 8, minStock: 3, unit: 'шт', pricePerUnit: 120, dailyUsage: 1 },
  { name: 'Колба (запасная)', currentStock: 3, minStock: 2, unit: 'шт', pricePerUnit: 800, dailyUsage: 0.1 },
  { name: 'Шланг (запасной)', currentStock: 5, minStock: 2, unit: 'шт', pricePerUnit: 500, dailyUsage: 0.2 },
];

export function AnalyticsPage() {
  const saved = loadSettings();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showConfig, setShowConfig] = useState(false);

  // Editable settings
  const [hookahPrice, setHookahPrice] = useState(saved?.hookahPrice || 1200);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(saved?.expenses || defaultExpenses);
  const [inventory, setInventory] = useState<InventoryItem[]>(saved?.inventory || defaultInventory);
  const [editingInventory, setEditingInventory] = useState(false);

  // Liquid glass settings — scoped to AnalyticsPage only, cleaned up on unmount
  const [blurVal, setBlurVal] = useState(() => Number(localStorage.getItem('glass_blur') || '40'));
  const [opacityVal, setOpacityVal] = useState(() => Number(localStorage.getItem('glass_opacity') || '0.72'));

  useEffect(() => {
    const origBlur = getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim();
    const origOpacity = getComputedStyle(document.documentElement).getPropertyValue('--glass-opacity').trim();
    return () => {
      if (origBlur) document.documentElement.style.setProperty('--glass-blur', origBlur);
      else document.documentElement.style.removeProperty('--glass-blur');
      if (origOpacity) document.documentElement.style.setProperty('--glass-opacity', origOpacity);
      else document.documentElement.style.removeProperty('--glass-opacity');
    };
  }, []);

  const handleBlurChange = (val: number) => {
    setBlurVal(val);
    localStorage.setItem('glass_blur', val.toString());
    document.documentElement.style.setProperty('--glass-blur', `${val}px`);
  };

  const handleOpacityChange = (val: number) => {
    setOpacityVal(val);
    localStorage.setItem('glass_opacity', val.toString());
    document.documentElement.style.setProperty('--glass-opacity', val.toString());
  };

  useEffect(() => {
    (async () => {
      try { 
        const { data } = await api.get<Booking[]>('/api/bookings/all'); 
        setAllBookings(data); 
      } catch {}
      try {
        const { data } = await api.get<Invoice[]>('/api/invoices');
        setInvoices(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSaveSettings = () => {
    saveSettings({ hookahPrice, expenses, inventory });
    showToast('Настройки сохранены', 'success');
    setShowConfig(false);
  };

  // Period filters
  const now = new Date();
  const periodStart = new Date();
  const prevPeriodStart = new Date();

  const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  periodStart.setDate(now.getDate() - daysInPeriod);
  prevPeriodStart.setDate(now.getDate() - (daysInPeriod * 2));

  const activeBookings = allBookings.filter(b => b.status !== 'cancelled');

  const periodBookings = activeBookings.filter(b => {
    const d = new Date(b.date);
    return d >= periodStart;
  });

  const prevPeriodBookings = activeBookings.filter(b => {
    const d = new Date(b.date);
    return d >= prevPeriodStart && d < periodStart;
  });

  const periodInvoices = invoices.filter(i => {
    const d = new Date(i.date);
    return d >= periodStart;
  });

  const totalInvoiceSpend = periodInvoices.reduce((s, i) => s + i.totalAmount, 0);

  const monthFrac = daysInPeriod / 30;

  // Financial aggregates
  const totalHookahs = periodBookings.reduce((s, b) => s + ((b as any).hookahCount || 1), 0);
  const grossRevenue = totalHookahs * hookahPrice;
  const fixedExpenses = Math.round(expenses.reduce((s, e) => s + e.amount, 0) * monthFrac);
  const inventoryExpenses = Math.round(inventory.reduce((s, i) => s + i.dailyUsage * i.pricePerUnit * daysInPeriod, 0));
  const totalExpenses = fixedExpenses + inventoryExpenses + totalInvoiceSpend;
  const totalGuests = periodBookings.reduce((s, b) => s + b.guestsCount, 0);
  const totalOrders = periodBookings.length;

  const lowStock = inventory.filter(i => i.currentStock <= i.minStock);
  const critical = inventory.filter(i => i.currentStock <= i.minStock * 0.5);

  // 1. BI Metric: LTV (Lifetime Value) & Cohort Metrics
  // Group bookings by user
  const userBookingsMap: Record<string, { name: string; count: number; spend: number }> = {};
  activeBookings.forEach(b => {
    const uName = (typeof b.user === 'object' && b.user !== null) ? b.user.name : 'Гость Клуба';
    const uId = (typeof b.user === 'object' && b.user !== null) ? (b.user._id || b.user.id || 'unknown') : (b.user || 'unknown');
    if (!userBookingsMap[uId]) {
      userBookingsMap[uId] = { name: uName, count: 0, spend: 0 };
    }
    const hCount = (b as any).hookahCount || 1;
    userBookingsMap[uId].count += 1;
    userBookingsMap[uId].spend += hCount * hookahPrice;
  });

  const uniqueUsers = Object.keys(userBookingsMap);
  const totalSpendAllTime = Object.values(userBookingsMap).reduce((s, u) => s + u.spend, 0);
  const averageLTV = uniqueUsers.length > 0 ? Math.round(totalSpendAllTime / uniqueUsers.length) : 0;

  // 2. BI Metric: Retention Rate
  const retainedUsers = Object.values(userBookingsMap).filter(u => u.count > 1).length;
  const retentionRate = uniqueUsers.length > 0 ? Math.round((retainedUsers / uniqueUsers.length) * 100) : 0;

  // 3. BI Metric: Occupancy (Загруженность залов)
  // Total slots: 15 tables * 12 time slots per day = 180 total daily capacity
  const TOTAL_SEATS = 15;
  const TIME_SLOTS_COUNT = 12;
  const totalCapacitySlots = TOTAL_SEATS * TIME_SLOTS_COUNT * daysInPeriod;
  const occupancyRate = totalCapacitySlots > 0 ? Math.round((periodBookings.length / totalCapacitySlots) * 100 * 10) / 10 : 0;

  // Occupancy per zone details
  const zoneCounts: Record<string, number> = { vip: 0, pro: 0, hall: 0, ps: 0 };
  periodBookings.forEach(b => {
    const zone = b.seatZone || 'hall';
    if (zoneCounts[zone] !== undefined) {
      zoneCounts[zone]++;
    } else {
      zoneCounts[zone] = 1;
    }
  });

  // 4. BI Metric: Predictive Revenue (Прогноз выручки ИИ)
  const prevHookahs = prevPeriodBookings.reduce((s, b) => s + ((b as any).hookahCount || 1), 0);
  const prevRevenue = prevHookahs * hookahPrice;
  const revenueGrowthRate = prevRevenue > 0 ? (grossRevenue - prevRevenue) / prevRevenue : 0;
  const predictedRevenue = Math.round(grossRevenue * (1 + Math.max(-0.2, Math.min(0.5, revenueGrowthRate))));

  // Heatmap popularity of seats
  const seatPopularityMap: Record<string, { label: string; count: number; zone: string }> = {};
  activeBookings.forEach(b => {
    const sId = b.seatId || 'unknown';
    const sLabel = b.seatLabel || sId;
    const sZone = b.seatZone || 'hall';
    if (!seatPopularityMap[sId]) {
      seatPopularityMap[sId] = { label: sLabel, count: 0, zone: sZone };
    }
    seatPopularityMap[sId].count++;
  });

  const sortedSeats = Object.values(seatPopularityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const fmt = (n: number) => n.toLocaleString('ru-RU') + ' ₽';

  if (loading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" /></div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-accent-gold" /> BI Центр Аналитики 3.0
          </h1>
          <p className="text-xs sm:text-sm text-white/40">Сквозной LTV • Загруженность залов • Удержание гостей</p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                period === p ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
                  : 'text-white/40 hover:text-white/60 border border-transparent'}`}>
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
            </button>
          ))}
          <button onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold border border-transparent hover:border-accent-gold/20">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Config Panel */}
      {showConfig && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <GlassCard className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-accent-gold" /> Настройки расчётов
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Средний чек с кальяна (₽)</label>
                <input type="number" value={hookahPrice} onChange={e => setHookahPrice(Number(e.target.value))}
                  className="glass-input text-sm w-full" />
              </div>
            </div>

            {/* Glassmorphism settings */}
            <div className="border-t border-white/5 pt-3 mt-3 mb-4 space-y-4">
              <p className="text-xs uppercase tracking-wider text-accent-gold font-bold">Настройки Жидкого Стекла (Liquid Glass)</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-white/60">Размытие заднего фона (Blur)</span>
                    <span className="text-accent-gold font-mono">{blurVal}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={blurVal} 
                    onChange={(e) => handleBlurChange(Number(e.target.value))}
                    className="w-full accent-accent-gold bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-white/60">Прозрачность стекла (Opacity)</span>
                    <span className="text-accent-gold font-mono">{Math.round(opacityVal * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.01"
                    value={opacityVal} 
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                    className="w-full accent-accent-gold bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-white/40 mb-2">Фиксированные расходы клуба:</p>
            <div className="space-y-2 mb-3">
              {expenses.map((exp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input value={exp.label} onChange={e => {
                    const n = [...expenses]; n[idx].label = e.target.value; setExpenses(n);
                  }} className="glass-input text-xs flex-1" />
                  <input type="number" value={exp.amount} onChange={e => {
                    const n = [...expenses]; n[idx].amount = Number(e.target.value); setExpenses(n);
                  }} className="glass-input text-xs w-24 sm:w-28 text-right" />
                  <span className="text-[10px] text-white/30">₽/мес</span>
                  <button onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))}
                    className="text-red-400/40 hover:text-red-400 text-xs">✕</button>
                </div>
              ))}
              <button onClick={() => setExpenses([...expenses, { label: 'Новый расход', amount: 0 }])}
                className="text-[10px] text-accent-gold hover:underline">+ Добавить расход</button>
            </div>

            <GlowButton size="sm" onClick={handleSaveSettings}>
              <Save className="w-3.5 h-3.5" /> Сохранить настройки
            </GlowButton>
          </GlassCard>
        </motion.div>
      )}

      {/* Stock warning notifications */}
      {lowStock.length > 0 && (
        <GlassCard className="p-3 sm:p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-semibold text-amber-400">⚠️ Предупреждение склада расходников</span>
          </div>
          <div className="space-y-1">
            {lowStock.map(item => (
              <div key={item.name} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className={critical.includes(item) ? 'text-red-400 font-semibold' : 'text-amber-400'}>{item.name}</span>
                <span className="text-white/50">{item.currentStock} {item.unit} (критический лимит: {item.minStock})</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Modern Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: DollarSign, label: 'Выручка', value: fmt(grossRevenue), sub: `${totalHookahs} шт кальянов`, color: 'text-green-400', bg: 'bg-green-500/10' },
          { icon: TrendingDown, label: 'Все расходы', value: fmt(totalExpenses), sub: 'Фермы+ЗП+Склад', color: 'text-red-400', bg: 'bg-red-500/10' },
          { icon: Percent, label: 'Загруженность залов', value: `${occupancyRate}%`, sub: `из ${totalCapacitySlots} сеансов`, color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
          { icon: Repeat, label: 'Retention Rate', value: `${retentionRate}%`, sub: 'вернувшиеся гости', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <GlassCard className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`} />
                </div>
                <span className="text-[10px] sm:text-xs text-white/40">{card.label}</span>
              </div>
              <p className={`text-lg sm:text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-[9px] sm:text-[10px] text-white/30 mt-0.5 leading-tight">{card.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Advanced BI Dashboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* LTV & Predictive Analysis */}
        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-gold" /> Предиктивный ИИ-Анализ & LTV
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-glass-border/30">
              <div>
                <span className="text-[10px] uppercase text-white/40 block">Средний LTV гостя</span>
                <span className="text-base sm:text-lg font-bold text-accent-gold">{fmt(averageLTV)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-white/40 block">Активных резидентов</span>
                <span className="text-base sm:text-lg font-bold text-white">{uniqueUsers.length} чел</span>
              </div>
            </div>

            {/* Predictive Model Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-yellow-950/30 to-black border border-amber-500/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <div className="flex items-center gap-2 mb-2 text-amber-300 font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Прогноз ИИ на следующий месяц</span>
              </div>
              <p className="text-[10px] text-white/60 leading-relaxed mb-3">
                Машинный алгоритм прогнозирует изменение динамики на основе тренда роста бронирований: <span className="text-green-400 font-semibold">{(revenueGrowthRate * 100).toFixed(1)}%</span>.
              </p>
              <div className="flex justify-between items-center border-t border-amber-500/10 pt-2 text-xs">
                <span className="text-white/40">Ожидаемая выручка:</span>
                <span className="text-white font-bold font-mono text-sm">{fmt(predictedRevenue)}</span>
              </div>
            </div>

            {/* Top spending VIP guests */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Топ Резидентов по вкладу (LTV)</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {Object.values(userBookingsMap)
                  .sort((a, b) => b.spend - a.spend)
                  .slice(0, 3)
                  .map((guest, idx) => (
                    <div key={guest.name} className="flex justify-between items-center text-[10px] sm:text-xs text-white/70 bg-black/25 px-3 py-1.5 rounded-xl border border-glass-border/10">
                      <span className="truncate font-semibold text-white/90">#{idx + 1} {guest.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white/40">{guest.count} броней</span>
                        <span className="text-accent-gold font-bold">{fmt(guest.spend)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Heatmap & Occupancy per Zone */}
        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Тепловая карта популярности столов
          </h3>

          <div className="space-y-4">
            {/* Occupancy per zone graph bars */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Популярность игровых зон</span>
              {[
                { key: 'vip', label: '👑 VIP Кабинеты (PlayStation 5)', max: 4, color: 'bg-amber-500' },
                { key: 'pro', label: '⚡ PRO Зона (600Hz Esports)', max: 4, color: 'bg-red-500' },
                { key: 'hall', label: '🛋️ Общий зал лаунжа', max: 5, color: 'bg-accent-gold' },
              ].map(zone => {
                const count = zoneCounts[zone.key] || 0;
                const pct = Math.min(100, Math.round((count / (zone.max * daysInPeriod)) * 100));
                return (
                  <div key={zone.key} className="space-y-0.5 text-[10px] sm:text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>{zone.label}</span>
                      <span className="font-semibold text-white/95">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${zone.color} opacity-80`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hot seats leaderboard */}
            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Самые бронируемые столы (Hotspots)</span>
              <div className="space-y-1.5">
                {sortedSeats.map((seat, idx) => (
                  <div key={seat.label} className="flex justify-between items-center text-[10px] sm:text-xs text-white/70 bg-black/20 p-2 rounded-xl border border-glass-border/10">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold text-[9px]">#{idx + 1}</span>
                      <span className="font-semibold text-white/90">{seat.label} ({seat.zone.toUpperCase()})</span>
                    </div>
                    <span className="font-mono text-accent-gold font-bold">{seat.count} бронирований</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Original Expenses + Financial details list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-display font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" /> Расшифровка расходов
          </h3>
          <div className="space-y-2.5">
            {expenses.map((item) => {
              const amt = Math.round(item.amount * monthFrac);
              return (
                <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-white/60 flex-1">{item.label}</span>
                  <span className="text-[10px] sm:text-xs text-white/80 font-medium">{fmt(amt)}</span>
                  <div className="w-12 sm:w-20 h-1.5 rounded-full bg-glass-bg overflow-hidden">
                    <div className="h-full rounded-full bg-red-400 opacity-60"
                      style={{ width: `${totalExpenses > 0 ? (amt / totalExpenses * 100) : 0}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-white/60 flex-1">Расходники</span>
              <span className="text-[10px] sm:text-xs text-white/80 font-medium">{fmt(inventoryExpenses)}</span>
              <div className="w-12 sm:w-20 h-1.5 rounded-full bg-glass-bg overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 opacity-60"
                  style={{ width: `${totalExpenses > 0 ? (inventoryExpenses / totalExpenses * 100) : 0}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-gold flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-white/60 flex-1">Закупки сырья (ИП Восторгин)</span>
              <span className="text-[10px] sm:text-xs text-white/80 font-medium">{fmt(totalInvoiceSpend)}</span>
              <div className="w-12 sm:w-20 h-1.5 rounded-full bg-glass-bg overflow-hidden">
                <div className="h-full rounded-full bg-accent-gold opacity-60"
                  style={{ width: `${totalExpenses > 0 ? (totalInvoiceSpend / totalExpenses * 100) : 0}%` }} />
              </div>
            </div>
            <div className="h-px bg-glass-border" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80 font-semibold">Итого</span>
              <span className="text-sm text-red-400 font-bold">{fmt(totalExpenses)}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-display font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-gold" /> Детализация по сессиям
          </h3>
          <div className="space-y-2.5">
            {[
              ['Всего сессий бронирования', `${totalOrders}`, 'text-white'],
              ['Количество кальянов заказано', `${totalHookahs}`, 'text-white'],
              ['Средний чек сессии', totalOrders > 0 ? fmt(Math.round(grossRevenue / totalOrders)) : '—', 'text-accent-gold'],
              ['Среднее число гостей/заказ', totalOrders > 0 ? (totalGuests / totalOrders).toFixed(1) : '—', 'text-white'],
              ['Средняя выручка в день', fmt(Math.round(grossRevenue / daysInPeriod)), 'text-green-400'],
            ].map(([label, val, clr]) => (
              <div key={label as string} className="flex justify-between text-[10px] sm:text-xs">
                <span className="text-white/50">{label}</span>
                <span className={`font-semibold ${clr}`}>{val}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Raw Material Invoices Section */}
      <GlassCard className="p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-accent-gold" /> Журнал закупок (ИП Восторгин А.В.)
        </h3>
        <div className="space-y-3">
          {periodInvoices.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">Нет закупок за выбранный период</p>
          ) : (
            periodInvoices.map(invoice => {
              const isExpanded = expandedInvoice === invoice.id;
              return (
                <div key={invoice.id} className="border border-glass-border/30 rounded-2xl overflow-hidden bg-black/10">
                  <div 
                    onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white font-mono">{invoice.invoiceNumber}</span>
                      <span className="text-[10px] text-white/40 ml-3">
                        {new Date(invoice.date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-accent-gold">{fmt(invoice.totalAmount)}</span>
                      <span className="text-[10px] text-white/30">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-3 bg-black/20 border-t border-glass-border/10 space-y-2">
                      <div className="text-[10px] text-white/40 font-semibold grid grid-cols-12 gap-2 border-b border-glass-border/10 pb-1">
                        <span className="col-span-6">Товар / Услуга</span>
                        <span className="col-span-2 text-right">Кол-во</span>
                        <span className="col-span-2 text-right">Цена</span>
                        <span className="col-span-2 text-right">Сумма</span>
                      </div>
                      {invoice.items.map((item, idx) => (
                        <div key={idx} className="text-[10px] text-white/70 grid grid-cols-12 gap-2 py-0.5">
                          <span className="col-span-6 truncate">{item.name}</span>
                          <span className="col-span-2 text-right font-mono">{item.qty} шт</span>
                          <span className="col-span-2 text-right font-mono">{fmt(item.price)}</span>
                          <span className="col-span-2 text-right font-mono text-white">{fmt(item.qty * item.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Consumables Inventory */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-display font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" /> Учёт остатков склада
          </h3>
          <GlowButton size="sm" onClick={() => {
            if (editingInventory) { saveSettings({ hookahPrice, expenses, inventory }); showToast('Остатки обновлены', 'success'); }
            setEditingInventory(!editingInventory);
          }}>{editingInventory ? 'Сохранить склад' : 'Редактировать запасы'}</GlowButton>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-[10px] sm:text-xs min-w-[400px]">
            <thead>
              <tr className="text-white/40 border-b border-glass-border">
                <th className="text-left py-2 pr-2">Наименование</th>
                <th className="text-right py-2 px-2">Остаток</th>
                <th className="text-right py-2 px-2">Мин. порог</th>
                <th className="text-right py-2 px-2">Расход/день</th>
                <th className="text-right py-2 pl-2">Прогноз запаса</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => {
                const daysLeft = item.dailyUsage > 0 ? Math.floor(item.currentStock / item.dailyUsage) : 999;
                const isLow = item.currentStock <= item.minStock;
                const isCrit = item.currentStock <= item.minStock * 0.5;
                return (
                  <tr key={item.name} className="border-b border-glass-border/50">
                    <td className={`py-2 pr-2 ${isCrit ? 'text-red-400 font-semibold' : isLow ? 'text-amber-400' : 'text-white/70'}`}>
                      {isCrit ? '🔴' : isLow ? '🟡' : '🟢'} {item.name}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {editingInventory ? (
                        <input type="number" value={item.currentStock} onChange={e => {
                          const n = [...inventory]; n[idx].currentStock = Number(e.target.value); setInventory(n);
                        }} className="glass-input !py-1 !px-1 text-[10px] w-14 text-right" />
                      ) : (<span className="text-white font-semibold">{item.currentStock}</span>)}
                    </td>
                    <td className="py-2 px-2 text-right text-white/40">{item.minStock}</td>
                    <td className="py-2 px-2 text-right text-white/40">{item.dailyUsage}</td>
                    <td className={`py-2 pl-2 text-right font-semibold ${daysLeft < 3 ? 'text-red-400' : daysLeft < 7 ? 'text-amber-400' : 'text-white/50'}`}>
                      {daysLeft === 999 ? '∞' : `${daysLeft}д`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

