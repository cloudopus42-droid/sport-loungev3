import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, RotateCcw, Trash2, Play, Square } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

interface WebScoutStatus {
  status: string;
  cycle: number;
  totalScrapes: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  lastScan: string;
  enabled?: boolean;
  recentLog: string;
}

export function WebScoutPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<WebScoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/webscout/status', {
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
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const toggleAgent = async () => {
    if (!status) return;
    setToggling(true);
    try {
      const res = await fetch('/api/webscout/status', {
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

  const clearCache = async () => {
    try {
      await fetch('/api/webscout/clear-cache', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchStatus();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div className="w-8 h-8 border-2 border-[#00BFA5] border-t-transparent rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const isActive = status?.status === 'working' || status?.status === 'idle';
  const cacheRate = status && (status.cacheHits + status.cacheMisses) > 0
    ? Math.round((status.cacheHits / (status.cacheHits + status.cacheMisses)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#00BFA5]" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-white">WebScout Agent</h1>
            <p className="text-xs text-white/40">Веб-парсер с кешированием</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlowButton onClick={clearCache} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60">
            <Trash2 className="w-3 h-3 mr-1" /> Очистить кеш
          </GlowButton>
          <GlowButton onClick={toggleAgent} disabled={toggling}
            className={`text-xs px-4 py-2 ${isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-[#00BFA5]/20 text-[#00BFA5] hover:bg-[#00BFA5]/30'}`}>
            {isActive ? <><Square className="w-3 h-3 mr-1" /> Выключить</> : <><Play className="w-3 h-3 mr-1" /> Включить</>}
          </GlowButton>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Циклы</p>
          <p className="text-2xl font-bold font-heading text-white">{status?.cycle || 0}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Спарсено</p>
          <p className="text-2xl font-bold font-heading text-[#00BFA5]">{status?.totalScrapes || 0}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Кеш-хиты</p>
          <p className="text-2xl font-bold font-heading text-accent-gold-bright">{status?.cacheHits || 0}</p>
          <p className="text-[10px] text-white/30">{cacheRate}% попаданий</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Ошибки</p>
          <p className="text-2xl font-bold font-heading text-red-400">{status?.errors || 0}</p>
        </GlassCard>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-white/30">
        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00BFA5]' : 'bg-white/20'}`} />
        {isActive ? 'Активен' : 'Выключен'} · последний цикл: {status?.lastScan || '—'}
      </div>

      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-3.5 h-3.5 text-white/40" />
          <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Лог</h2>
        </div>
        <pre className="text-[11px] text-white/50 font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {status?.recentLog || 'Нет записей'}
        </pre>
      </GlassCard>
    </div>
  );
}
