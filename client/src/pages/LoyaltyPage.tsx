import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Award, Gift, TrendingUp, Star, Copy, Check, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { showToast } from '@/components/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const TIERS = [
  { key: 'bronze', label: 'Bronze', minSpend: 0, color: 'from-amber-800 to-amber-900', text: 'text-amber-400', icon: Star },
  { key: 'silver', label: 'Silver', minSpend: 5000, color: 'from-slate-400 to-zinc-500', text: 'text-slate-300', icon: Award },
  { key: 'gold', label: 'Gold', minSpend: 15000, color: 'from-amber-600 to-yellow-700', text: 'text-accent-gold-bright', icon: Crown },
  { key: 'platinum', label: 'Platinum', minSpend: 30000, color: 'from-zinc-700 to-zinc-900', text: 'text-white', icon: TrendingUp },
];

export function LoyaltyPage() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [m, l] = await Promise.all([
          api('/api/memberships/me', { signal: ac.signal }),
          api('/api/memberships/logs', { signal: ac.signal }),
        ]);
        setMembership(m);
        setLogs(Array.isArray(l) ? l : []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setReferralLink(`${window.location.origin}/invitations?ref=${user.id}`);
    }
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('Ссылка скопирована!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTier = membership
    ? TIERS.slice().reverse().find(t => (membership.totalSpent || 0) >= t.minSpend) || TIERS[0]
    : TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSpent = membership?.totalSpent || 0;
  const points = membership?.points || 0;

  return (
    <div className="min-h-screen bg-dark-bg px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Crown className="w-8 h-8 text-accent-gold-bright mx-auto" />
          <h1 className="text-2xl font-heading font-bold text-white">SPORT LOUNGE Loyalty</h1>
          <p className="text-sm text-white/50">Программа лояльности для постоянных гостей</p>
        </div>

        <GlassCard variant="premium" className={`p-6 bg-gradient-to-br ${currentTier.color} border-0`}>
          <div className="flex items-center justify-between mb-4">
            <currentTier.icon className={`w-6 h-6 ${currentTier.text}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${currentTier.text}`}>{currentTier.label}</span>
          </div>
          <p className="text-3xl font-heading font-bold text-white">{points.toLocaleString('ru-RU')}</p>
          <p className="text-xs text-white/60 mt-1">баллов</p>
          <div className="mt-4 h-1.5 rounded-full bg-black/30 overflow-hidden">
            <div className="h-full bg-accent-gold-bright rounded-full" style={{
              width: nextTier ? `${Math.min(100, ((totalSpent - currentTier.minSpend) / (nextTier.minSpend - currentTier.minSpend)) * 100)}%` : '100%'
            }} />
          </div>
          {nextTier ? (
            <p className="text-xs text-white/50 mt-2">
              До {nextTier.label}: {(nextTier.minSpend - totalSpent).toLocaleString('ru-RU')} ₽
            </p>
          ) : (
            <p className="text-xs text-accent-gold-bright mt-2">Максимальный уровень!</p>
          )}
        </GlassCard>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Потрачено', value: `${totalSpent.toLocaleString('ru-RU')} ₽` },
            { label: 'Заказов', value: `${membership?.totalOrders || 0}` },
            { label: 'Кешбэк', value: `${membership?.cashbackPercent || 0}%` },
          ].map(s => (
            <GlassCard key={s.label} className="p-3 text-center">
              <p className="text-base font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-white/40">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="premium" className="p-5">
          <h3 className="text-sm font-heading font-semibold text-white mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-accent-gold-bright" /> Пригласить друга
          </h3>
          <p className="text-xs text-white/50 mb-3">Получите 200 баллов за каждого друга, который совершит первый заказ</p>
          <div className="flex gap-2">
            <input readOnly value={referralLink} className="glass-input flex-1 text-xs !py-2" onClick={(e) => (e.target as HTMLInputElement).select()} />
            <GlowButton size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </GlowButton>
          </div>
        </GlassCard>

        {logs.length > 0 && (
          <GlassCard variant="premium" className="p-5">
            <h3 className="text-sm font-heading font-semibold text-white mb-3">История начислений</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log: any, i: number) => (
                <div key={log.id || i} className="flex items-center justify-between py-1.5 border-b border-glass-border/5 last:border-0">
                  <div>
                    <p className="text-xs text-white/80">{log.reason || 'Начисление'}</p>
                    <p className="text-[10px] text-white/30">{new Date(log.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <span className="text-xs font-bold text-accent-gold-bright">+{log.points}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
