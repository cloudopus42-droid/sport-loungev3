import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/lib/api';

interface AdminLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  level: 'info' | 'warn' | 'error';
  created_at: string;
}

const levelColors: Record<string, string> = {
  error: 'text-red-400 bg-red-500/10 border-red-500/30',
  warn: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  info: 'text-white/70 bg-white/5 border-white/10',
};

export function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLogs = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await api<AdminLog[]>('/api/admin/logs', { signal: controller.signal });
      setLogs(data || []);
    } catch {
      // ignore aborted requests
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="space-y-3 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-lg font-display font-semibold text-white tracking-wide">Журнал действий</h1>
        <p className="text-[11px] text-white/40 mt-0">Логирование административных операций</p>
      </motion.div>

      <GlassCard variant="premium" className="p-0 overflow-hidden border-glass-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-glass-border/10 text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3 font-bold text-accent-gold">Время</th>
                <th className="py-2 px-3 font-bold text-accent-gold">Пользователь</th>
                <th className="py-2 px-3 font-bold text-accent-gold">Действие</th>
                <th className="py-2 px-3 font-bold text-accent-gold">Детали</th>
                <th className="py-2 px-3 font-bold text-accent-gold">Уровень</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/30">Загрузка логов...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/20">Логов пока нет</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 text-white/50 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-2 px-3 text-white/80 font-mono text-[10px]">{log.user_id.slice(0, 8)}...</td>
                    <td className="py-2 px-3 text-white font-medium">{log.action}</td>
                    <td className="py-2 px-3 text-white/50 max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${levelColors[log.level] || levelColors.info}`}>
                        {log.level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
