import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Calendar, Filter, Flame, MapPin } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import { SEATS, ZONE_COLORS, ZONE_LABELS } from '@/config/seats';
import type { Booking, User } from '@/types';

const statusConfig: Record<string, { text: string; color: 'green' | 'yellow' | 'gray' }> = {
  pending: { text: 'Ожидает', color: 'yellow' },
  confirmed: { text: 'Подтверждена', color: 'green' },
  cancelled: { text: 'Отменена', color: 'gray' },
};

const hookahStatusLabels: Record<string, string> = {
  accepted: '📋 Заказ принят',
  heating: '🔥 Угли горят',
  almost: '💨 Почти готово',
  ready: '✅ Готово!',
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
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [hookahStatuses, setHookahStatuses] = useState<Record<string, any>>({});

  const fetchBookings = useCallback(async () => {
    try {
      const params: any = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get<Booking[]>('/api/bookings/all', { params });
      setBookings(data);
    } catch {
      showToast('Ошибка загрузки', 'error');
    }
    setLoading(false);
  }, [filterDate, filterStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Auto-refresh hookah statuses every 15s
  useEffect(() => {
    const fetchStatuses = async () => {
      const active = bookings.filter(b => b.status !== 'cancelled');
      const results: Record<string, any> = {};
      for (const b of active) {
        try {
          const { data } = await api.get(`/api/bookings/${b._id}/hookah-status`);
          results[b._id] = data;
        } catch {}
      }
      setHookahStatuses(results);
    };
    if (bookings.length > 0) fetchStatuses();
    const interval = setInterval(() => { if (bookings.length > 0) fetchStatuses(); }, 15000);
    return () => clearInterval(interval);
  }, [bookings]);

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      await api.put(`/api/bookings/${id}/status`, { status });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      showToast(status === 'confirmed' ? 'Заказ подтверждён' : 'Заказ отклонён', 'success');
    } catch { showToast('Ошибка', 'error'); }
  };

  // Stats
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const bookedSeatIds = new Set(activeBookings.map(b => b.seatId));
  const totalGuests = activeBookings.reduce((s, b) => s + b.guestsCount, 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const waitingHookah = activeBookings.filter(b => {
    const hs = hookahStatuses[b._id];
    return hs && hs.hookahStatus !== 'ready';
  }).length;

  // Bookings for selected seat
  const seatBookings = selectedSeatId
    ? activeBookings.filter(b => b.seatId === selectedSeatId)
    : [];

  return (
    <div className="space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Заказы и посадка</h1>
          <p className="text-sm text-white/40 mt-0.5">Карта зала • Заказы кальянов</p>
        </div>
      </motion.div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-accent-cyan" />
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

      {/* Main Layout: Map + Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seating Map — left 2/3 */}
        <div className="lg:col-span-2">
          <GlassCard className="p-4">
            <h3 className="text-sm font-display font-semibold text-white mb-3">
              Карта зала {filterDate && `— ${new Date(filterDate).toLocaleDateString('ru-RU')}`}
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(ZONE_LABELS).map(([zone, label]) => (
                <div key={zone} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded"
                    style={{ backgroundColor: ZONE_COLORS[zone as keyof typeof ZONE_COLORS].bg,
                      border: `1px solid ${ZONE_COLORS[zone as keyof typeof ZONE_COLORS].border}` }} />
                  <span className="text-white/50">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                <span className="text-white/50">Занято</span>
              </div>
            </div>

            {/* Map */}
            <div className="relative w-full aspect-[4/3] bg-dark-bg/60 rounded-xl border border-glass-border overflow-hidden">
              {/* Floor labels */}
              <div className="absolute left-[2%] top-[1%] text-[9px] sm:text-[10px] text-cyan-400/50 font-bold tracking-wider">1 ЭТАЖ — ОБЩИЙ ЗАЛ (31 ПК)</div>
              <div className="absolute left-[55%] top-[50%] text-[9px] sm:text-[10px] text-blue-400/50 font-bold tracking-wider">2 ЭТАЖ — PS5</div>
              <div className="absolute left-[2%] top-[68%] text-[9px] sm:text-[10px] text-purple-400/50 font-bold tracking-wider">VIP PS</div>
              <div className="absolute left-[22%] top-[68%] text-[9px] sm:text-[10px] text-amber-400/50 font-bold tracking-wider">КОМНАТЫ (КОРИДОР)</div>

              {/* Floor dividers */}
              <div className="absolute left-0 right-0 border-t border-dashed border-white/10" style={{ top: '50%' }} />
              <div className="absolute left-0 right-0 border-t border-dashed border-white/10" style={{ top: '68%' }} />

              {SEATS.map(seat => {
                const booked = bookedSeatIds.has(seat.id);
                const selected = selectedSeatId === seat.id;
                const colors = ZONE_COLORS[seat.zone];
                const seatBooking = activeBookings.find(b => b.seatId === seat.id);
                const hs = seatBooking ? hookahStatuses[seatBooking._id] : null;

                return (
                  <motion.button key={seat.id}
                    onClick={() => setSelectedSeatId(selected ? null : seat.id)}
                    className={`absolute rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer
                      ${selected ? 'border-white/60 ring-2 ring-accent-cyan/30' : ''}
                    `}
                    style={{
                      left: `${seat.x}%`, top: `${seat.y}%`,
                      width: `${seat.width}%`, height: `${seat.height}%`,
                      backgroundColor: booked ? 'rgba(239,68,68,0.15)' : colors.bg,
                      borderColor: selected ? '#fff' : booked ? 'rgba(239,68,68,0.4)' : colors.border,
                    }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                    <span className="text-[9px] sm:text-[11px] font-semibold"
                      style={{ color: booked ? '#ef4444' : colors.text }}>{seat.label}</span>
                    {booked && hs && (
                      <span className={`text-[7px] sm:text-[9px] font-medium ${hookahStatusColors[hs.hookahStatus] || 'text-white/40'}`}>
                        {hs.hookahStatus === 'ready' ? '✅' : hs.hookahStatus === 'almost' ? '💨' : hs.hookahStatus === 'heating' ? '🔥' : '📋'}
                      </span>
                    )}
                    {!booked && <span className="text-[7px] text-white/30">до {seat.capacity}</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Selected seat detail */}
            {selectedSeatId && seatBookings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-glass-bg border border-glass-border">
                <h4 className="text-sm font-semibold text-white mb-2">
                  {SEATS.find(s => s.id === selectedSeatId)?.label} — Заказы
                </h4>
                {seatBookings.map(b => {
                  const u = b.user as User;
                  const hs = hookahStatuses[b._id];
                  return (
                    <div key={b._id} className="text-xs text-white/60 space-y-0.5 border-b border-glass-border pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                      <p className="font-medium text-white">👤 {u?.name} • {b.phone}</p>
                      <p>💨 {(b as any).hookahMix} • {(b as any).hookahCount || 1} шт • {(b as any).hookahStrength === 'light' ? 'Лёгкий' : (b as any).hookahStrength === 'strong' ? 'Крепкий' : 'Средний'}</p>
                      <p>👥 {b.guestsCount} чел • {b.time}</p>
                      {hs && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-glass-bg overflow-hidden">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-green-400"
                              initial={{ width: 0 }} animate={{ width: `${hs.progressPercent}%` }}
                              transition={{ duration: 0.5 }} />
                          </div>
                          <span className={`text-[10px] font-medium ${hookahStatusColors[hs.hookahStatus]}`}>
                            {hookahStatusLabels[hs.hookahStatus] || hs.hookahStatusLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </GlassCard>
        </div>

        {/* Right Panel — Stats */}
        <div className="space-y-4">
          {/* Overview cards */}
          <GlassCard className="p-4 space-y-4">
            <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-cyan" /> Общая картина
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-accent-cyan">{bookedSeatIds.size}</p>
                <p className="text-[10px] text-white/40">Мест занято</p>
              </div>
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-white">{SEATS.length - bookedSeatIds.size}</p>
                <p className="text-[10px] text-white/40">Свободно</p>
              </div>
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-amber-400">{totalGuests}</p>
                <p className="text-[10px] text-white/40">Гостей</p>
              </div>
              <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-center">
                <p className="text-2xl font-bold text-orange-400">{waitingHookah}</p>
                <p className="text-[10px] text-white/40">Ждут кальян</p>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-xs text-amber-400 font-medium">⚠️ {pendingCount} заказ(ов) ожидают подтверждения</p>
              </div>
            )}
          </GlassCard>

          {/* Waiting for hookah */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" /> Готовность кальянов
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {activeBookings.map(b => {
                const hs = hookahStatuses[b._id];
                if (!hs) return null;
                const u = b.user as User;
                return (
                  <div key={b._id} className="p-2 rounded-lg bg-glass-bg border border-glass-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{b.seatLabel} • {u?.name}</span>
                      <span className={`text-[10px] font-medium ${hookahStatusColors[hs.hookahStatus]}`}>
                        {hookahStatusLabels[hs.hookahStatus]}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-dark-bg overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-green-400"
                        animate={{ width: `${hs.progressPercent}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    {hs.minutesLeft > 0 && (
                      <p className="text-[9px] text-white/30 mt-0.5">{hs.minutesLeft} мин</p>
                    )}
                  </div>
                );
              })}
              {activeBookings.length === 0 && (
                <p className="text-xs text-white/30 text-center py-4">Нет активных заказов</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bookings List */}
      <div>
        <h3 className="text-lg font-display font-semibold text-white mb-3">Все заказы</h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-white/40">Нет заказов{filterDate ? ' на эту дату' : ''}</p>
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
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{booking.seatLabel}</span>
                          <Badge text={st.text} color={st.color} size="sm" />
                          <span className="text-xs text-white/30">
                            {new Date(booking.date).toLocaleDateString('ru-RU')} в {booking.time}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs text-white/50 space-y-0.5">
                          <p>👤 {user?.name || '—'} • {user?.email || '—'}</p>
                          <p>📱 {booking.phone} • 👥 {booking.guestsCount} чел</p>
                          <p>💨 {(booking as any).hookahMix || '—'} • {(booking as any).hookahStrength === 'light' ? 'Лёгкий' : (booking as any).hookahStrength === 'strong' ? 'Крепкий' : 'Средний'} • {(booking as any).hookahCount || 1} шт</p>
                          {booking.comment && <p>💬 {booking.comment}</p>}
                        </div>
                        {/* Hookah progress */}
                        {hs && booking.status !== 'cancelled' && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 rounded-full bg-glass-bg overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-green-400 transition-all duration-500"
                                style={{ width: `${hs.progressPercent}%` }} />
                            </div>
                            <span className={`text-[10px] font-medium whitespace-nowrap ${hookahStatusColors[hs.hookahStatus]}`}>
                              {hookahStatusLabels[hs.hookahStatus]}
                            </span>
                          </div>
                        )}
                      </div>

                      {booking.status === 'pending' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <GlowButton size="sm" onClick={() => updateStatus(booking._id, 'confirmed')}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </GlowButton>
                          <GlowButton size="sm" variant="danger" onClick={() => updateStatus(booking._id, 'cancelled')}>
                            <XCircle className="w-3.5 h-3.5" />
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
    </div>
  );
}
