import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame, Clock, CheckCircle2, AlertTriangle,
  Phone, ArrowLeft, RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { showToast } from '@/components/NotificationToast';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';

const STEPS = [
  { key: 'accepted', label: 'Принят', icon: CheckCircle2 },
  { key: 'preparing', label: 'Подготовка', icon: Flame },
  { key: 'roasting', label: 'Прогрев', icon: Clock },
  { key: 'delivering', label: 'Подача', icon: Phone },
  { key: 'done', label: 'Подан', icon: CheckCircle2 },
];

const STEP_ORDER = ['accepted', 'preparing', 'roasting', 'delivering', 'done'];

export function OrderTrackerPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const { socket } = useSocket();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const data = await api(`/api/orders/${orderId}`);
      setOrder(data);
      if (data.promisedDeliveryTime) {
        const diff = Math.floor((new Date(data.promisedDeliveryTime).getTime() - Date.now()) / 1000);
        setRemainingSeconds(Math.max(0, diff));
      }
    } catch {
      setError('Не удалось загрузить информацию о заказе');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    if (!socket || !orderId) return;
    const handler = (updated: any) => {
      if (updated.id === orderId) {
        setOrder((prev: any) => ({ ...prev, ...updated }));
        if (updated.promisedDeliveryTime) {
          const diff = Math.floor((new Date(updated.promisedDeliveryTime).getTime() - Date.now()) / 1000);
          setRemainingSeconds(Math.max(0, diff));
        }
      }
    };
    socket.on('order:updated', handler);
    return () => { socket.off('order:updated', handler); };
  }, [socket, orderId]);

  useEffect(() => {
    if (!order || order.status === 'done') return;
    const interval = setInterval(() => {
      setRemainingSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const handleCallMaster = async () => {
    try {
      await api(`/api/orders/${orderId}/request-master`, { method: 'POST' });
      showToast('Мастер вызван! Скоро подойдёт', 'success');
    } catch {
      showToast('Ошибка при вызове мастера', 'error');
    }
  };

  const currentStepIndex = order ? STEP_ORDER.indexOf(order.status) : -1;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <GlassCard variant="premium" className="max-w-md w-full p-8 text-center">
          <p className="text-white/60 mb-6">Укажите ID заказа в адресе: /order-tracker?id=XXX</p>
          <Link to="/">
            <GlowButton variant="secondary">На главную</GlowButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <GlassCard variant="premium" className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <GlowButton variant="secondary" onClick={fetchOrder}>
              <RefreshCw className="w-4 h-4" /> Повторить
            </GlowButton>
            <Link to="/">
              <GlowButton variant="secondary">На главную</GlowButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const isDone = order.status === 'done';

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-8">
        <Link to="/order" className="inline-flex items-center gap-1.5 text-xs text-accent-gold-bright hover:text-accent-gold-light transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к заказу
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-bold text-white">Отслеживание заказа</h1>
          <p className="text-xs text-accent-gold-bright font-mono">{orderId?.slice(0, 8)}...</p>
          {order.seatLabel && (
            <p className="text-sm text-white/60">Стол: <span className="text-white font-semibold">{order.seatLabel}</span></p>
          )}
        </div>

        {!isDone && (
          <GlassCard variant="premium" className="p-6 text-center">
            <div className={`text-5xl font-heading font-bold mb-1 ${remainingSeconds <= 120 ? 'text-red-400 animate-pulse' : 'text-accent-gold-bright'}`}>
              {formatTime(remainingSeconds)}
            </div>
            <p className="text-xs text-white/40">Осталось до готовности</p>
          </GlassCard>
        )}

        <div className="relative px-4">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-glass-border" />
          <div className="space-y-8">
            {STEPS.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive
                      ? 'bg-accent-gold-bright/20 border-accent-gold-bright text-accent-gold-bright'
                      : 'bg-dark-surface border-glass-border text-white/20'
                  } ${isCurrent ? 'shadow-[0_0_12px_rgba(255,191,0,0.3)]' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className={`text-sm font-semibold ${
                      isActive ? 'text-accent-gold-bright' : 'text-white/30'
                    }`}>{step.label}</p>
                    {isCurrent && (
                      <p className="text-xs text-white/40 mt-0.5">{order.notes || 'В процессе'}</p>
                    )}
                    {idx === currentStepIndex && order.masterCalled && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Мастер вызван
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isDone && (
          <GlassCard variant="premium" className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h2 className="text-lg font-heading font-bold text-white mb-1">Кальян подан!</h2>
            <p className="text-sm text-white/50">Приятного покура!</p>
          </GlassCard>
        )}

        {order?.rating === null && isDone && (
          <GlassCard variant="premium" className="p-5">
            <h3 className="text-sm font-heading font-semibold text-white mb-3 text-center">Оцените кальян</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={async () => {
                    try {
                      await api(`/api/orders/${orderId}/rating`, { method: 'PUT', body: { rating: star } });
                      showToast('Спасибо за оценку!', 'success');
                      fetchOrder();
                    } catch { showToast('Ошибка', 'error'); }
                  }}
                  className="w-10 h-10 rounded-full bg-dark-surface border border-glass-border flex items-center justify-center hover:border-accent-gold-bright/40 transition-colors"
                >
                  <span className="text-lg">{star}⭐</span>
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard variant="premium" className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent-gold-bright" />
              <span className="text-xs text-white/60">Нужна помощь?</span>
            </div>
            <GlowButton size="sm" variant="danger" onClick={handleCallMaster}>
              <AlertTriangle className="w-3.5 h-3.5" /> Вызвать мастера
            </GlowButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
