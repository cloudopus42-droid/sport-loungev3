import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface TableData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  shape?: 'rect' | 'round';
  clickable?: boolean;
}

const PRESET_COLORS: Record<string, { bg: string; border: string }> = {
  purple: { bg: 'rgba(138,43,226,0.25)', border: 'rgba(168,85,247,0.5)' },
  blue: { bg: 'rgba(59,130,246,0.25)', border: 'rgba(96,165,250,0.5)' },
  green: { bg: 'rgba(34,197,94,0.25)', border: 'rgba(74,222,128,0.5)' },
  amber: { bg: 'rgba(245,158,11,0.25)', border: 'rgba(251,191,36,0.5)' },
  red: { bg: 'rgba(239,68,68,0.25)', border: 'rgba(248,113,113,0.5)' },
  cyan: { bg: 'rgba(6,182,212,0.25)', border: 'rgba(34,211,238,0.5)' },
  pink: { bg: 'rgba(236,72,153,0.25)', border: 'rgba(244,114,182,0.5)' },
  slate: { bg: 'rgba(100,116,139,0.25)', border: 'rgba(148,163,184,0.5)' },
};

export function FloorMapPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/floor-map')
      .then(r => r.json())
      .then(data => {
        if (data.tables && Array.isArray(data.tables)) {
          setTables(data.tables);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chosen = tables.find(t => t.id === chosenId);
  const clickableTables = tables.filter(t => t.clickable !== false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-16 text-white/30 text-sm">
        Карта помещения пока не настроена
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification */}
      <motion.div
        className={`text-center py-3 px-4 rounded-xl text-sm font-semibold transition-colors
          ${chosen
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-white/[0.02] border border-white/5 text-white/30'}`}
        animate={chosen ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {chosen ? (
          <span className="flex items-center justify-center gap-2">
            <Check size={16} />
            Вы выбрали место: {chosen.name}
          </span>
        ) : (
          'Нажмите на стол, чтобы выбрать место'
        )}
      </motion.div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full rounded-2xl border border-white/5 overflow-hidden"
        style={{
          aspectRatio: '16 / 10',
          background: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      >
        {tables.map(table => {
          const isChosen = chosenId === table.id;
          const isClickable = table.clickable !== false;
          const cs = PRESET_COLORS[table.color || 'purple'] || PRESET_COLORS.purple;
          const isRound = table.shape === 'round';

          return (
            <motion.div
              key={table.id}
              className={`absolute flex items-center justify-center border-2 select-none
                ${isRound ? 'rounded-full' : 'rounded-lg'}
                ${isClickable
                  ? `cursor-pointer ${isChosen
                      ? 'border-green-400 bg-green-500/25 shadow-[0_0_0_3px_rgba(34,197,94,0.3),0_0_24px_rgba(34,197,94,0.1)]'
                      : 'hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]'}`
                  : 'cursor-default opacity-40'
              }`}
              style={{
                left: `${table.x * 100}%`,
                top: `${table.y * 100}%`,
                width: `${table.width * 100}%`,
                height: `${table.height * 100}%`,
                background: isChosen ? undefined : cs.bg,
                borderColor: isChosen ? undefined : (isClickable ? cs.border : 'rgba(255,255,255,0.1)'),
              }}
              whileHover={isClickable ? { scale: 1.02 } : undefined}
              whileTap={isClickable ? { scale: 0.98 } : undefined}
              onClick={() => { if (isClickable) setChosenId(table.id); }}
            >
              <span className={`text-xs sm:text-sm font-bold text-center pointer-events-none drop-shadow-lg truncate max-w-[90%] px-1
                ${isChosen ? 'text-green-400' : isClickable ? 'text-white/90' : 'text-white/40'}`}>
                {table.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-[11px] text-white/30">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-purple-500/40 bg-purple-500/20" />
          Свободно
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-green-400 bg-green-500/25" />
          Выбрано
        </span>
      </div>
    </div>
  );
}
