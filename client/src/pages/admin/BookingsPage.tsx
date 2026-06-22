import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Flame } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { Booking, User } from '@/types';

const statusConfig: Record<string, { text: string; color: 'green' | 'yellow' | 'gray' }> = {
  pending: { text: 'Ожидает', color: 'yellow' },
  confirmed: { text: 'Подтвержден', color: 'green' },
  cancelled: { text: 'Отменен', color: 'gray' },
};

const hookahStatusLabels: Record<string, string> = {
  accepted: '📋 Принят',
  heating: '🔥 Греются угли',
  almost: '💨 Почти готов',
  ready: '✅ Готов к подаче!',
};

const hookahStatusColors: Record<string, string> = {
  accepted: 'text-blue-400',
  heating: 'text-orange-400',
  almost: 'text-amber-400',
  ready: 'text-green-400',
};

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterStatus, setFilterStatus] = useState('');
  const [hookahStatuses, setHookahStatuses] = useState<Record<string, any>>({});

  const fetchBookings = useCallback(async (signal?: AbortSignal) => {
    try {
      const params: any = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      const data = await api<Booking[]>('/api/bookings/all', { params, signal });
      setBookings(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Ошибка загрузки', 'error');
    }
    setLoading(false);
  }, [filterDate, filterStatus]);

  useEffect(() => {
    const ac = new AbortController();
    fetchBookings(ac.signal);
    return () => ac.abort();
  }, [fetchBookings]);

  // Auto-refresh hookah statuses every 15s
  useEffect(() => {
    const ac = new AbortController();
    const fetchStatuses = async () => {
      const active = bookings.filter(b => b.status !== 'cancelled');
      const results: Record<string, any> = {};
      for (const b of active) {
        try {
          const data = await api(`/api/bookings/${b._id}/hookah-status`, { signal: ac.signal });
          if (ac.signal.aborted) return;
          results[b._id] = data;
        } catch {}
      }
      setHookahStatuses(results);
    };
    if (bookings.length > 0) fetchStatuses();
    const interval = setInterval(() => { if (bookings.length > 0) fetchStatuses(); }, 15000);
    return () => { clearInterval(interval); ac.abort(); };
  }, [bookings]);

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      await api(`/api/bookings/${id}/status`, { method: 'PUT', body: { status } });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      showToast(status === 'confirmed' ? 'Заказ подтверждён' : 'Заказ отклонён', 'success');
    } catch { showToast('Ошибка при обновлении статуса', 'error'); }
  };

  // Stats
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const preparingCount = activeBookings.filter(b => {
    const hs = hookahStatuses[b._id];
    return hs && hs.hookahStatus !== 'ready';
  }).length;
  const readyCount = activeBookings.filter(b => {
    const hs = hookahStatuses[b._id];
    return hs && hs.hookahStatus === 'ready';
  }).length;
  const totalCount = bookings.length;

  return (
    <div className="space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Управление заказами кальянов</h1>
          <p className="text-sm text-white/40 mt-0.5">Входящие заказы • Статусы приготовления</p>
        </div>
      </motion.div>

      {/* Filters */}
      <GlassCard variant="premium" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-accent-gold" />
          <span className="text-sm font-medium text-white">Фильтры</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-white/40" />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="glass-input text-xs !py-1.5 w-36" />
            {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-white/30 hover:text-white/60">×</button>}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="glass-input text-xs !py-1.5 w-36">
            <option value="">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="confirmed">Подтверждённые</option>
            <option value="cancelled">Отменённые</option>
          </select>
        </div>
      </GlassCard>

      {/* Grid: Left - Orders list, Right - Stats and hookah queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Orders list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-display font-semibold text-white">Входящие заказы</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-sm text-white/40">Нет заказов{filterDate ? ' на выбранную дату' : ''}</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking, i) => {
                const st = statusConfig[booking.status] || statusConfig.pending;
                const user = booking.user as User;
                const hs = hookahStatuses[booking._id];
                return (
                  <motion.div key={booking._id} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.02 }}>
                    <GlassCard variant="premium" className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white bg-white/5 border border-glass-border px-2.5 py-0.5 rounded-lg">{booking.seatLabel}</span>
                            <Badge text={st.text} color={st.color} size="sm" />
                            <span className="text-xs text-white/30">
                              {new Date(booking.date).toLocaleDateString('ru-RU')} в {booking.time}
                            </span>
                          </div>
                          <div className="mt-2.5 text-xs text-white/50 space-y-1">
                            <p className="font-semibold text-white">👤 {user?.name || '—'} • {booking.phone}</p>
                            <p className="text-accent-gold font-medium">💨 {(booking as any).hookahMix || '—'}</p>
                            <p>Крепость: <span className="font-semibold text-white">{(booking as any).hookahStrength === 'light' ? 'Лёгкий' : (booking as any).hookahStrength === 'strong' ? 'Крепкий' : 'Средний'}</span> • {(booking as any).hookahCount || 1} шт • Гостей: {booking.guestsCount} чел</p>
                            {booking.comment && <p className="italic text-white/45">💬 Комментарий: {booking.comment}</p>}
                          </div>

                          {/* Hookah progress bar */}
                          {hs && booking.status !== 'cancelled' && (
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex-1 h-1.5 rounded-full bg-glass-bg overflow-hidden border border-white/5">
                                <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                                  style={{ width: `${hs.progressPercent}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${hookahStatusColors[hs.hookahStatus]}`}>
                                {hookahStatusLabels[hs.hookahStatus]}
                              </span>
                            </div>
                          )}
                        </div>

                        {booking.status === 'pending' && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <GlowButton size="sm" onClick={() => updateStatus(booking._id, 'confirmed')} className="shadow-glow-gold-lg text-black font-bold">
                              Принять
                            </GlowButton>
                            <GlowButton size="sm" variant="danger" onClick={() => updateStatus(booking._id, 'cancelled')}>
                              Отклонить
                            </GlowButton>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Stats and Hookah queue */}
        <div className="space-y-4">
          <GlassCard variant="premium" className="p-4 space-y-4">
            <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 border-b border-glass-border/10 pb-2">
              📊 Сводка заказов
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                <p className="text-[10px] text-white/40">Ожидают</p>
              </div>
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-orange-400">{preparingCount}</p>
                <p className="text-[10px] text-white/40">Готовятся</p>
              </div>
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-green-400">{readyCount}</p>
                <p className="text-[10px] text-white/40">Готовы</p>
              </div>
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-white">{totalCount}</p>
                <p className="text-[10px] text-white/40">Всего сегодня</p>
              </div>
            </div>
          </GlassCard>

          {/* Active Hookah cooking board */}
          <GlassCard variant="premium" className="p-4">
            <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-3 border-b border-glass-border/10 pb-2">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" /> Очередь приготовления
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide pr-1">
              {activeBookings.map(b => {
                const hs = hookahStatuses[b._id];
                if (!hs) return null;
                const u = b.user as User;
                return (
                  <div key={b._id} className="p-2.5 rounded-xl bg-glass-bg border border-glass-border/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{b.seatLabel} • {u?.name}</span>
                      <span className={`text-[10px] font-bold ${hookahStatusColors[hs.hookahStatus]}`}>
                        {hookahStatusLabels[hs.hookahStatus]}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-dark-bg overflow-hidden border border-white/5">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                        animate={{ width: `${hs.progressPercent}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    {hs.minutesLeft > 0 && (
                      <p className="text-[9px] text-white/30 font-medium">{hs.minutesLeft} мин до готовности</p>
                    )}
                  </div>
                );
              })}
              {activeBookings.length === 0 && (
                <p className="text-xs text-white/30 text-center py-6">Нет активных заказов</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

