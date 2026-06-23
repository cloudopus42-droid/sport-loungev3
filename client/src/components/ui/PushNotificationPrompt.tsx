import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { GlowButton } from './GlowButton';
import { showToast } from '@/components/NotificationToast';

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported] = useState(() => 'Notification' in window);

  useEffect(() => {
    if (supported) setPermission(Notification.permission);
  }, [supported]);

  const requestPermission = async () => {
    if (!supported) {
      showToast('Push-уведомления не поддерживаются в вашем браузере', 'error');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      showToast('Уведомления включены!', 'success');
    }
  };

  if (!supported || permission === 'granted') return null;

  return (
    <GlassCard className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {permission === 'denied' ? (
          <BellOff className="w-5 h-5 text-red-400" />
        ) : (
          <Bell className="w-5 h-5 text-accent-gold-bright" />
        )}
        <div>
          <p className="text-xs text-white font-semibold">Push-уведомления</p>
          <p className="text-[10px] text-white/40">
            {permission === 'denied' ? 'Отключены в настройках браузера' : 'Узнавайте о статусе заказа'}
          </p>
        </div>
      </div>
      {permission === 'default' && (
        <GlowButton size="sm" onClick={requestPermission}>
          <Bell className="w-3 h-3" /> Включить
        </GlowButton>
      )}
    </GlassCard>
  );
}
