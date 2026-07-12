import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Check, Flame, ChevronUp, ChevronDown, RefreshCw, Send, Trash2 } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';

export function OrdersAdmin() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualReorder, setManualReorder] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetchQueueRef = useRef<AbortController | null>(null);

  // Load orders queue on mount
  useEffect(() => {
    fetchQueue();
    return () => { fetchQueueRef.current?.abort(); };
  }, []);

  // Socket updates subscription
  useEffect(() => {
    if (!socket) return;

    socket.on('order:created', (newOrder: any) => {
      setOrders(prev => {
        if (prev.some(o => o.id === newOrder.id)) return prev;
        showToast(`Новый заказ за стол ${newOrder.seatLabel}! 💨`, 'success');
        return [...prev, newOrder];
      });
    });

    socket.on('order:updated', (updated: any) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    });

    socket.on('orders:reordered', (newQueue: any[]) => {
      setOrders(newQueue);
    });

    socket.on('order:deleted', ({ id }: { id: string }) => {
      setOrders(prev => prev.filter(o => o.id !== id));
    });

    return () => {
      socket.off('order:created');
      socket.off('order:updated');
      socket.off('orders:reordered');
      socket.off('order:deleted');
    };
  }, [socket]);

  const fetchQueue = async () => {
    fetchQueueRef.current?.abort();
    const ac = new AbortController();
    fetchQueueRef.current = ac;
    setLoading(true);
    try {
      // Fetch active orders (not done)
      const data = await api('/api/orders', { signal: ac.signal });
      setOrders(data || []);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Не удалось загрузить очередь заказов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const result = await api(`/api/orders/${id}/status`, { method: 'PUT', body: { status: newStatus } });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...result } : o));
      showToast(`Статус заказа обновлен! 💨`, 'success');
      
      // If status is 'done', remove from queue view or flag as done
      if (newStatus === 'done') {
        setOrders(prev => prev.filter(o => o.id !== id));
      }
    } catch (err: any) {
      showToast('Ошибка при обновлении статуса', 'error');
    }
  };

  const handleExtendTime = async (id: string, minutes: number) => {
    try {
      const result = await api(`/api/orders/${id}/extend-time`, { method: 'POST', body: { minutes } });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...result } : o));
      showToast(`Время заказа успешно продлено на +${minutes} мин!`, 'success');
    } catch (err: any) {
      showToast('Ошибка при продлении времени', 'error');
    }
  };

  // Reordering controls
  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!manualReorder) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orders.length) return;

    const newQueue = [...orders];
    // Swap items
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIdx];
    newQueue[targetIdx] = temp;

    // Local update
    setOrders(newQueue);

    // Save to server
    try {
      const ids = newQueue.map(o => o.id);
      await api('/api/orders/reorder', { method: 'PUT', body: { ids } });
      showToast('Очередь заказов успешно сохранена.', 'success');
    } catch (err: any) {
      showToast('Ошибка при изменении порядка очереди', 'error');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Удалить заказ? Заказ будет отменён.')) return;
    try {
      await api.delete(`/api/orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      showToast('Заказ удалён', 'success');
    } catch { showToast('Ошибка при удалении', 'error'); }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Удалить ${selectedIds.size} заказ(ов)?`)) return;
    let success = 0;
    for (const id of selectedIds) {
      try {
        await api.delete(`/api/orders/${id}`);
        success++;
      } catch {}
    }
    setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
    setSelectedIds(new Set());
    showToast(`Удалено ${success} заказ(ов)`, 'success');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const active = orders.filter(o => o.status !== 'done');
    if (selectedIds.size === active.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(active.map(o => o.id)));
    }
  };

  // Countdown timer calculation per card
  const getRemainingTimeText = (promisedTimeStr: string, status: string) => {
    if (status === 'done') return { text: 'Готово', delayed: false };
    const diff = new Date(promisedTimeStr).getTime() - Date.now();
    if (diff <= 0) {
      const lateMins = Math.abs(Math.floor(diff / 1000 / 60));
      return { text: `Просрочен: ${lateMins} мин`, delayed: true };
    }
    const mins = Math.floor(diff / 1000 / 60);
    const secs = Math.floor((diff / 1000) % 60);
    return { text: `${mins}:${secs.toString().padStart(2, '0')}`, delayed: false };
  };

  // Force re-renders for timer ticks
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 space-y-3">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white font-display uppercase">
            Очередь заказов кальянов
          </h1>
          <p className="text-[10px] text-white/50">Панель управления кальянного мастера (Sport Lounge)</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-red-600/10 text-red-500 border-red-500/30 hover:bg-red-600/20"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              Удалить {selectedIds.size}
            </button>
          )}

          <button
            onClick={() => setManualReorder(!manualReorder)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              manualReorder
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-white/5 text-white/40 border-transparent'
            }`}
          >
            {manualReorder ? '🎛 Ручная очередь: ВКЛ' : '🎛 Ручная очередь: ВЫКЛ'}
          </button>

          <button
            onClick={fetchQueue}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            title="Обновить очередь"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {orders.filter(o => o.status !== 'done').length === 0 ? (
        <div className="py-12 text-center space-y-1">
          <Flame className="w-8 h-8 text-white/20 mx-auto" />
          <h3 className="text-base font-semibold text-white/40 uppercase">Заказов пока нет</h3>
          <p className="text-xs text-white/30">Все кальяны успешно раскурены и поданы!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.filter(o => o.status !== 'done').length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === orders.filter(o => o.status !== 'done').length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span className="text-xs text-white/40">Выбрать все</span>
            </div>
          )}
          {orders
            .filter(o => o.status !== 'done')
            .map((order, idx) => {
              const timerInfo = getRemainingTimeText(order.promisedDeliveryTime, order.status);
              const statusColors: Record<string, string> = {
                accepted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                preparing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                roasting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                delivering: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
              };

              const orderStrength = order.strength ?? (order.notes?.match(/^\[S:(\w+)\]/)?.[1] ?? 'medium');

              return (
                <motion.div
                  key={order.id}
                  layoutId={order.id}
                  className={`mafia-card p-4 border-l-4 ${
                    timerInfo.delayed 
                      ? 'border-l-red-600 border-red-950/20 bg-red-950/5' 
                      : 'border-l-accent-gold'
                  }`}
                >
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      {/* Position & Seat info */}
                      <div className="flex gap-3 items-start">
                      {/* Checkbox */}
                      <div className="pt-1.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {manualReorder && (
                        <div className="flex flex-col gap-1 pr-2 pt-1 border-r border-white/5">
                          <button
                            onClick={() => moveOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white transition-all disabled:opacity-20"
                            title="Вверх в очереди"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveOrder(idx, 'down')}
                            disabled={idx === orders.length - 1}
                            className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white transition-all disabled:opacity-20"
                            title="Вниз в очереди"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-white/30">#{idx + 1}</span>
                          <h3 className="text-sm font-bold text-white font-display uppercase tracking-wide">
                            {order.seatLabel}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[order.status] || 'bg-white/5 text-white'}`}>
                            {order.status === 'accepted' ? 'Принят' : order.status === 'preparing' ? 'Подбор табака' : order.status === 'roasting' ? 'Раскуривание' : 'В доставке'}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                            orderStrength === 'light' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            orderStrength === 'strong' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            <Flame className="w-2.5 h-2.5" />
                            {orderStrength === 'light' ? 'Лёгкий' : orderStrength === 'strong' ? 'Крепкий' : 'Средний'}
                          </span>

                          {order.hookahMix && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10 truncate max-w-[160px]" title={order.hookahMix}>
                              {order.hookahMix}
                            </span>
                          )}

                          {order.masterCalled && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-600/20 text-red-500 border border-red-500/35 animate-pulse uppercase tracking-wider">
                              Вызов мастера! 🚨
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-white/70 leading-relaxed font-light">
                          Пожелания: {order.notes ? <strong className="text-white/90">"{order.notes}"</strong> : <em className="text-white/30">нет</em>}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono pt-0.5">
                          <span>Заказчик: {order.user?.name || 'Гость'}</span>
                          <span>•</span>
                          <span>Контакты: {order.user?.phone || 'Не указаны'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timer and Controls */}
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-3 justify-between min-w-[240px]">
                      
                      {/* Timer Display */}
                      <div className={`p-2 rounded-lg border text-center font-mono ${
                        timerInfo.delayed
                          ? 'bg-red-500/10 text-red-400 border-red-500/30 font-bold'
                          : 'bg-white/5 text-white/70 border-white/10'
                      }`}>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-0.5">
                          <Clock className="w-3.5 h-3.5" /> Таймер
                        </div>
                        <span className="text-lg font-bold">{timerInfo.text}</span>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-1">
                           {order.status === 'accepted' && (
                             <button
                               onClick={() => handleUpdateStatus(order.id, 'preparing')}
                               className="flex-1 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                            >
                              <Play className="w-3 h-3 fill-current" /> Начать
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'roasting')}
                              className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                            >
                              <Flame className="w-3 h-3" /> Угли
                            </button>
                          )}
                          {order.status === 'roasting' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'delivering')}
                              className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                            >
                              <Send className="w-3 h-3" /> Нести
                            </button>
                          )}
                          {order.status === 'delivering' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'done')}
                              className="flex-1 py-1.5 rounded-lg bg-accent-gold text-black font-extrabold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Подано
                            </button>
                          )}

                          {/* Delay / Extension trigger */}
                          <button
                            onClick={() => handleExtendTime(order.id, 5)}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs"
                            title="Продлить на +5 минут"
                          >
                            +5м
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="px-3 py-2 rounded-lg bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-500 font-bold text-xs"
                            title="Удалить заказ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Reset Master trigger if called */}
                        {order.masterCalled && (
                          <button
                            onClick={async () => {
                              try {
                                await api(`/api/orders/${order.id}/reset-master`, { method: 'POST' });
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, masterCalled: false } : o));
                                showToast('Статус вызова мастера сброшен.', 'success');
                              } catch { showToast('Ошибка при сбросе', 'error'); }
                            }}
                            className="w-full py-1.5 rounded-lg border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider"
                          >
                            Сбросить вызов
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}

