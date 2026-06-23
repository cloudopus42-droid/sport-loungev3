import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, XCircle, Server, Bug, Globe, Trash2, HeartPulse, Wrench } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

interface AgentInfo {
  status: string;
  cycle: number;
  color: string;
  lastScan: string;
  [key: string]: any;
}

const AGENT_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  bughunter: { label: 'BugHunter', icon: Bug, desc: 'Автономный поиск багов' },
  'cache-purger': { label: 'CachePurger', icon: Trash2, desc: 'Инвалидация кеша' },
  'health-checker': { label: 'HealthChecker', icon: HeartPulse, desc: 'Мониторинг эндпоинтов' },
  'omni-fixer': { label: 'OmniFixer', icon: Wrench, desc: 'Универсальный фиксер' },
  webscout: { label: 'WebScout', icon: Globe, desc: 'Веб-парсер' },
};

export function AgentHealthPage() {
  const { token } = useAuth();
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agents/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setAgents(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div className="w-8 h-8 border-2 border-accent-gold-bright border-t-transparent rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const agentEntries = Object.entries(AGENT_META);
  const onlineCount = Object.values(agents).filter(a => a.status === 'idle' || a.status === 'working').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-gold-bright/10 flex items-center justify-center">
            <Server className="w-5 h-5 text-accent-gold-bright" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-white">Состояние агентов</h1>
            <p className="text-xs text-white/40">{onlineCount}/{agentEntries.length} активны</p>
          </div>
        </div>
        <GlowButton onClick={fetchStatus} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60">
          <Activity className="w-3 h-3 mr-1" /> Обновить
        </GlowButton>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agentEntries.map(([id, meta]) => {
          const agent = agents[id];
          const isActive = agent?.status === 'idle' || agent?.status === 'working';
          const Icon = meta.icon;
          const color = agent?.color || '#888';

          return (
            <GlassCard key={id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {isActive ? <><CheckCircle className="w-3 h-3" /> Активен</> : <><XCircle className="w-3 h-3" /> Офлайн</>}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">{meta.desc}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-white/30">
                    <span>Цикл: {agent?.cycle ?? 0}</span>
                    <span>Сканирование: {agent?.lastScan || '—'}</span>
                  </div>

                  {/* Agent-specific stats */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {agent?.found !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                        Найдено: {agent.found}
                      </span>
                    )}
                    {agent?.fixed !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                        Исправлено: {agent.fixed}
                      </span>
                    )}
                    {agent?.totalScrapes !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00BFA5]/10 text-[#00BFA5]">
                        Спарсено: {agent.totalScrapes}
                      </span>
                    )}
                    {agent?.passed !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                        OK: {agent.passed}/{agent.totalChecks}
                      </span>
                    )}
                    {agent?.errors !== undefined && agent.errors > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        Ошибки: {agent.errors}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
