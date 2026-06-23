import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Play, Square, RotateCcw, AlertTriangle, CheckCircle, XCircle, Activity, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

interface BugHunterStatus {
  enabled: boolean;
  active: boolean;
  featureEnabled: boolean;
  cycle: number;
  found: number;
  fixed: number;
  escalated: number;
  lastScan: string;
  daemonPid: number | null;
  logSize: number;
  recentLog: string;
  config: Record<string, unknown>;
}

export function BugHunterPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<BugHunterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bughunter/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const toggleAgent = async () => {
    if (!status) return;
    setToggling(true);
    try {
      const res = await fetch('/api/bughunter/status', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.enabled }),
      });
      if (!res.ok) throw new Error('Ошибка переключения');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          className="w-8 h-8 border-2 border-accent-gold-bright border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[rgba(244,67,54,0.12)] border border-[rgba(244,67,54,0.2)]">
            <Bug className="w-5 h-5 text-[#F44336]" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-white">BugHunter Agent</h1>
            <p className="text-sm text-white/40">Автономный охотник за багами</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 text-xs ${status?.active ? 'text-green-400' : 'text-white/30'}`}>
            <span className={`w-2 h-2 rounded-full ${status?.active ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
            {status?.active ? 'Активен' : 'Выключен'}
          </span>
          <GlowButton
            onClick={toggleAgent}
            disabled={toggling}
            className={status?.enabled ? '!bg-red-500/20 !border-red-500/30 !text-red-400' : ''}
          >
            {toggling ? (
              <motion.div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            ) : status?.enabled ? (
              <><Square className="w-4 h-4" /> Выключить</>
            ) : (
              <><Play className="w-4 h-4" /> Включить</>
            )}
          </GlowButton>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Циклов сканирования', value: status?.cycle ?? 0, icon: Activity, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400' },
          { label: 'Найдено багов', value: status?.found ?? 0, icon: AlertTriangle, color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400' },
          { label: 'Исправлено', value: status?.fixed ?? 0, icon: CheckCircle, color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400' },
          { label: 'Эскалировано', value: status?.escalated ?? 0, icon: XCircle, color: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Status card */}
      <GlassCard className="p-5">
        <h2 className="text-sm font-display font-semibold text-white mb-4">Детали агента</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/40">Статус: </span>
            <span className={status?.active ? 'text-green-400' : 'text-white/60'}>
              {status?.active ? 'Работает' : 'Остановлен'}
            </span>
          </div>
          <div>
            <span className="text-white/40">PID: </span>
            <span className="text-white/60">{status?.daemonPid ?? '—'}</span>
          </div>
          <div>
            <span className="text-white/40">Последнее сканирование: </span>
            <span className="text-white/60">{status?.lastScan ?? '—'}</span>
          </div>
          <div>
            <span className="text-white/40">Размер лога: </span>
            <span className="text-white/60">{status?.logSize ? `${(status.logSize / 1024).toFixed(1)} KB` : '—'}</span>
          </div>
        </div>
      </GlassCard>

      {/* Log preview */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-display font-semibold text-white">Последние действия</h2>
          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="Обновить"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        {status?.recentLog ? (
          <pre className="text-xs text-white/60 font-mono bg-black/30 rounded-lg p-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
            {status.recentLog}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-white/20">
            <FileText className="w-8 h-8 mb-2" />
            <p className="text-xs">Лог пуст. Запустите агента для начала сканирования.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
