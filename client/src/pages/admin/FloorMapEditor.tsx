import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Settings, List, Copy, X, Move, Maximize2 } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';

interface TableData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: 'rect' | 'round';
}

const MIN_SIZE = 0.03;

const PRESET_COLORS = [
  { value: 'purple', label: 'Фиолетовый', bg: 'rgba(138,43,226,0.25)', border: 'rgba(168,85,247,0.5)' },
  { value: 'blue', label: 'Синий', bg: 'rgba(59,130,246,0.25)', border: 'rgba(96,165,250,0.5)' },
  { value: 'green', label: 'Зелёный', bg: 'rgba(34,197,94,0.25)', border: 'rgba(74,222,128,0.5)' },
  { value: 'amber', label: 'Янтарный', bg: 'rgba(245,158,11,0.25)', border: 'rgba(251,191,36,0.5)' },
  { value: 'red', label: 'Красный', bg: 'rgba(239,68,68,0.25)', border: 'rgba(248,113,113,0.5)' },
  { value: 'cyan', label: 'Голубой', bg: 'rgba(6,182,212,0.25)', border: 'rgba(34,211,238,0.5)' },
  { value: 'pink', label: 'Розовый', bg: 'rgba(236,72,153,0.25)', border: 'rgba(244,114,182,0.5)' },
  { value: 'slate', label: 'Серый', bg: 'rgba(100,116,139,0.25)', border: 'rgba(148,163,184,0.5)' },
];

function getColorStyle(color: string) {
  const preset = PRESET_COLORS.find(c => c.value === color) || PRESET_COLORS[0];
  return { background: preset.bg, borderColor: preset.border };
}

function generateId() {
  return `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_TABLES: TableData[] = [
  { id: 'tbl-1', name: 'VIP-1',  x: 0.04, y: 0.06, width: 0.20, height: 0.18, color: 'purple', shape: 'rect' },
  { id: 'tbl-2', name: 'VIP-2',  x: 0.27, y: 0.06, width: 0.20, height: 0.18, color: 'purple', shape: 'rect' },
  { id: 'tbl-3', name: 'Стол 3', x: 0.52, y: 0.06, width: 0.18, height: 0.14, color: 'blue', shape: 'rect' },
  { id: 'tbl-4', name: 'Стол 4', x: 0.73, y: 0.06, width: 0.18, height: 0.14, color: 'blue', shape: 'rect' },
  { id: 'tbl-5', name: 'Барная', x: 0.04, y: 0.38, width: 0.34, height: 0.12, color: 'amber', shape: 'rect' },
  { id: 'tbl-6', name: 'Стол 6', x: 0.43, y: 0.38, width: 0.16, height: 0.18, color: 'green', shape: 'rect' },
  { id: 'tbl-7', name: 'Стол 7', x: 0.63, y: 0.38, width: 0.16, height: 0.18, color: 'green', shape: 'rect' },
  { id: 'tbl-8', name: 'Лаунж',  x: 0.04, y: 0.66, width: 0.38, height: 0.22, color: 'cyan', shape: 'round' },
  { id: 'tbl-9', name: 'Стол 9', x: 0.48, y: 0.66, width: 0.20, height: 0.22, color: 'pink', shape: 'rect' },
  { id: 'tbl-10', name: 'Стол 10', x: 0.72, y: 0.66, width: 0.22, height: 0.22, color: 'pink', shape: 'rect' },
];

export function FloorMapEditor() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [editingInline, setEditingInline] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');

  // Lasso (rubber band) state
  const [lasso, setLasso] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isLassoing, setIsLassoing] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load from server on mount
  useEffect(() => {
    fetch('/api/floor-map')
      .then(r => r.json())
      .then(data => {
        if (data.tables && Array.isArray(data.tables) && data.tables.length > 0) {
          setTables(data.tables.map((t: any) => ({ ...t, color: t.color || 'purple', shape: t.shape || 'rect' })));
        } else {
          setTables(DEFAULT_TABLES);
        }
      })
      .catch(() => setTables(DEFAULT_TABLES))
      .finally(() => setLoading(false));
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const pxToFrac = (px: number, dim: number) => px / dim;

  const selectedTable = useMemo(() => {
    if (selectedIds.size === 1) {
      const id = [...selectedIds][0];
      return tables.find(t => t.id === id) || null;
    }
    return null;
  }, [selectedIds, tables]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/floor-map', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables }),
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('Карта сохранена и опубликована', 'success');
    } catch {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  }, [tables]);

  // ── Add table ──
  const handleAdd = useCallback(() => {
    const count = tables.length;
    const col = count % 4;
    const row = Math.floor(count / 4);
    const newTable: TableData = {
      id: generateId(),
      name: `Стол ${count + 1}`,
      x: 0.04 + col * 0.23,
      y: 0.06 + row * 0.22,
      width: 0.18,
      height: 0.16,
      color: 'purple',
      shape: 'rect',
    };
    setTables(prev => [...prev, newTable]);
    setSelectedIds(new Set([newTable.id]));
  }, [tables.length]);

  // ── Delete selected ──
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setTables(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  // ── Duplicate selected ──
  const handleDuplicate = useCallback(() => {
    if (selectedIds.size === 0) return;
    const newTables: TableData[] = [];
    const newIds = new Set<string>();
    selectedIds.forEach(id => {
      const t = tables.find(x => x.id === id);
      if (t) {
        const dup: TableData = {
          ...t,
          id: generateId(),
          name: `${t.name} (копия)`,
          x: clamp(t.x + 0.03, 0, 1 - t.width),
          y: clamp(t.y + 0.03, 0, 1 - t.height),
        };
        newTables.push(dup);
        newIds.add(dup.id);
      }
    });
    setTables(prev => [...prev, ...newTables]);
    setSelectedIds(newIds);
  }, [selectedIds, tables]);

  // ── Update single table field ──
  const updateTable = useCallback((id: string, patch: Partial<TableData>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  // ── Update all selected tables ──
  const updateSelected = useCallback((patch: Partial<TableData>) => {
    setTables(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, ...patch } : t));
  }, [selectedIds]);

  // ── Inline rename ──
  const commitInlineRename = useCallback(() => {
    if (editingInline) {
      const val = inlineName.trim();
      if (val) updateTable(editingInline, { name: val });
      setEditingInline(null);
    }
  }, [editingInline, inlineName, updateTable]);

  // ══════════════════════════════════════════════
  //  DRAG — single block or all selected
  // ══════════════════════════════════════════════
  const startDrag = useCallback((e: React.MouseEvent, table: TableData) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    // Store originals for all selected blocks
    const originals = tables
      .filter(t => selectedIds.has(t.id))
      .map(t => ({ id: t.id, x: t.x, y: t.y }));

    // If clicking unselected block, select only it
    if (!selectedIds.has(table.id)) {
      setSelectedIds(new Set([table.id]));
    }

    const onMove = (ev: MouseEvent) => {
      const dx = pxToFrac(ev.clientX - startX, rect.width);
      const dy = pxToFrac(ev.clientY - startY, rect.height);
      setTables(prev => prev.map(t => {
        const orig = originals.find(o => o.id === t.id);
        if (!orig) return t;
        return {
          ...t,
          x: clamp(orig.x + dx, 0, 1 - t.width),
          y: clamp(orig.y + dy, 0, 1 - t.height),
        };
      }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [tables, selectedIds]);

  // ══════════════════════════════════════════════
  //  RESIZE
  // ══════════════════════════════════════════════
  const startResize = useCallback((e: React.MouseEvent, table: TableData, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = table.x;
    const origY = table.y;
    const origW = table.width;
    const origH = table.height;

    const onMove = (ev: MouseEvent) => {
      const dx = pxToFrac(ev.clientX - startX, rect.width);
      const dy = pxToFrac(ev.clientY - startY, rect.height);
      let newX = origX, newY = origY, newW = origW, newH = origH;

      if (dir.includes('e')) newW = clamp(origW + dx, MIN_SIZE, 1 - origX);
      else if (dir.includes('w')) {
        newW = clamp(origW - dx, MIN_SIZE, origX + origW);
        newX = clamp(origX + dx, 0, origX + origW - MIN_SIZE);
      }
      if (dir.includes('s')) newH = clamp(origH + dy, MIN_SIZE, 1 - origY);
      else if (dir.includes('n')) {
        newH = clamp(origH - dy, MIN_SIZE, origY + origH);
        newY = clamp(origY + dy, 0, origY + origH - MIN_SIZE);
      }
      updateTable(table.id, { x: newX, y: newY, width: newW, height: newH });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [updateTable]);

  // ══════════════════════════════════════════════
  //  LASSO (rubber band selection)
  // ══════════════════════════════════════════════
  const startLasso = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    // Only start lasso with left click on empty canvas area
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x1 = pxToFrac(e.clientX - rect.left, rect.width);
    const y1 = pxToFrac(e.clientY - rect.top, rect.height);

    setIsLassoing(true);
    setLasso({ x1, y1, x2: x1, y2: y1 });
    setSelectedIds(new Set());

    const onMove = (ev: MouseEvent) => {
      const x2 = pxToFrac(ev.clientX - rect.left, rect.width);
      const y2 = pxToFrac(ev.clientY - rect.top, rect.height);
      setLasso({ x1, y1, x2, y2 });

      // Find blocks inside lasso
      const lx = Math.min(x1, x2);
      const ly = Math.min(y1, y2);
      const lw = Math.abs(x2 - x1);
      const lh = Math.abs(y2 - y1);

      const hit = new Set<string>();
      tables.forEach(t => {
        if (t.x < lx + lw && t.x + t.width > lx && t.y < ly + lh && t.y + t.height > ly) {
          hit.add(t.id);
        }
      });
      setSelectedIds(hit);
    };

    const onUp = () => {
      setIsLassoing(false);
      setLasso(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [tables]);

  // ══════════════════════════════════════════════
  //  KEYBOARD: Delete, Escape, Ctrl+A
  // ══════════════════════════════════════════════
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingInline) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setShowSettings(false);
        setShowManager(false);
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedIds(new Set(tables.map(t => t.id)));
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedIds, editingInline, handleDeleteSelected, tables]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-3">
      {/* ═══════════ TOOLBAR ═══════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 active:scale-95 transition-all">
          <Plus size={13} /> Добавить
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-500 active:scale-95 transition-all disabled:opacity-50">
          <Save size={13} /> {saving ? '...' : 'Опубликовать'}
        </button>

        <div className="w-px h-5 bg-white/10" />

        {hasSelection && (
          <>
            <button onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs hover:text-white hover:border-white/20 transition-all">
              <Copy size={12} /> Дублировать ({selectedIds.size})
            </button>
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-400/30 text-purple-400 text-xs hover:bg-purple-400/10 transition-all">
              <Settings size={12} /> Настройки
            </button>
            <button onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-400/30 text-red-400 text-xs hover:bg-red-400/10 transition-all">
              <Trash2 size={12} /> Удалить
            </button>
          </>
        )}

        <button onClick={() => setShowManager(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white hover:border-white/20 transition-all">
          <List size={12} /> Все блоки
        </button>

        <span className="ml-auto text-[10px] text-white/25 font-mono">
          {tables.length} блоков · {selectedIds.size > 0 ? `${selectedIds.size} выбрано` : 'Ctrl+A — все'}
        </span>
      </div>

      {/* ═══════════ INLINE SETTINGS BAR (when 1 selected) ═══════════ */}
      {selectedTable && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-purple-400/60 font-mono">Настройки блока</span>

          {/* Name */}
          <input
            value={selectedTable.name}
            onChange={e => updateTable(selectedTable.id, { name: e.target.value })}
            className="px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-xs outline-none focus:border-purple-400 w-32"
            placeholder="Название"
          />

          {/* Position X */}
          <label className="flex items-center gap-1 text-[10px] text-white/30">
            X
            <input type="number" step="0.01" min="0" max="1"
              value={+selectedTable.x.toFixed(3)}
              onChange={e => updateTable(selectedTable.id, { x: clamp(parseFloat(e.target.value) || 0, 0, 1 - selectedTable.width) })}
              className="w-16 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-[11px] outline-none focus:border-purple-400"
            />
          </label>

          {/* Position Y */}
          <label className="flex items-center gap-1 text-[10px] text-white/30">
            Y
            <input type="number" step="0.01" min="0" max="1"
              value={+selectedTable.y.toFixed(3)}
              onChange={e => updateTable(selectedTable.id, { y: clamp(parseFloat(e.target.value) || 0, 0, 1 - selectedTable.height) })}
              className="w-16 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-[11px] outline-none focus:border-purple-400"
            />
          </label>

          {/* Width */}
          <label className="flex items-center gap-1 text-[10px] text-white/30">
            <Maximize2 size={10} className="rotate-90" />
            <input type="number" step="0.01" min="0.03" max="1"
              value={+selectedTable.width.toFixed(3)}
              onChange={e => updateTable(selectedTable.id, { width: clamp(parseFloat(e.target.value) || 0.03, 0.03, 1) })}
              className="w-16 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-[11px] outline-none focus:border-purple-400"
            />
          </label>

          {/* Height */}
          <label className="flex items-center gap-1 text-[10px] text-white/30">
            <Maximize2 size={10} />
            <input type="number" step="0.01" min="0.03" max="1"
              value={+selectedTable.height.toFixed(3)}
              onChange={e => updateTable(selectedTable.id, { height: clamp(parseFloat(e.target.value) || 0.03, 0.03, 1) })}
              className="w-16 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-[11px] outline-none focus:border-purple-400"
            />
          </label>

          {/* Color swatches */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map(c => (
              <button key={c.value}
                onClick={() => updateTable(selectedTable.id, { color: c.value })}
                className={`w-5 h-5 rounded-full border-2 transition-all ${selectedTable.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                style={{ background: c.bg, borderColor: selectedTable.color === c.value ? c.border : 'transparent' }}
                title={c.label}
              />
            ))}
          </div>

          {/* Shape */}
          <div className="flex items-center gap-1">
            <button onClick={() => updateTable(selectedTable.id, { shape: 'rect' })}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${selectedTable.shape === 'rect' ? 'bg-purple-500/30 text-purple-300' : 'text-white/30 hover:text-white/50'}`}>
              ▭
            </button>
            <button onClick={() => updateTable(selectedTable.id, { shape: 'round' })}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${selectedTable.shape === 'round' ? 'bg-purple-500/30 text-purple-300' : 'text-white/30 hover:text-white/50'}`}>
              ⬭
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ CANVAS ═══════════ */}
      <div
        ref={canvasRef}
        className="relative w-full rounded-2xl border border-white/5 overflow-hidden select-none"
        style={{
          aspectRatio: '16 / 10',
          background: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          cursor: 'crosshair',
        }}
        onMouseDown={startLasso}
      >
        {tables.map(table => {
          const cs = getColorStyle(table.color);
          const isSelected = selectedIds.has(table.id);
          return (
            <div
              key={table.id}
              className={`absolute flex items-center justify-center border-2 transition-shadow cursor-grab active:cursor-grabbing
                ${table.shape === 'round' ? 'rounded-full' : 'rounded-lg'}
                ${isSelected
                  ? 'shadow-[0_0_0_3px_rgba(168,85,247,0.3)]'
                  : 'hover:shadow-lg'}`}
              style={{
                left: `${table.x * 100}%`,
                top: `${table.y * 100}%`,
                width: `${table.width * 100}%`,
                height: `${table.height * 100}%`,
                background: cs.background,
                borderColor: isSelected ? '#a855f7' : cs.border,
              }}
              onMouseDown={e => {
                if ((e.target as HTMLElement).dataset.handle) return;
                e.stopPropagation();
                // Shift+click for multi-select
                if (e.shiftKey) {
                  setSelectedIds(prev => {
                    const next = new Set(prev);
                    if (next.has(table.id)) next.delete(table.id);
                    else next.add(table.id);
                    return next;
                  });
                  return;
                }
                startDrag(e, table);
              }}
              onDoubleClick={e => {
                e.stopPropagation();
                setEditingInline(table.id);
                setInlineName(table.name);
              }}
            >
              {/* Inline rename input */}
              {editingInline === table.id ? (
                <input
                  autoFocus
                  value={inlineName}
                  onChange={ev => setInlineName(ev.target.value)}
                  onBlur={commitInlineRename}
                  onKeyDown={ev => { if (ev.key === 'Enter') commitInlineRename(); if (ev.key === 'Escape') setEditingInline(null); }}
                  className="bg-black/50 border border-purple-400 rounded px-2 py-0.5 text-xs text-white text-center w-24 outline-none"
                  onClick={ev => ev.stopPropagation()}
                  onMouseDown={ev => ev.stopPropagation()}
                  maxLength={30}
                />
              ) : (
                <span className="text-[11px] sm:text-xs font-bold text-white/90 text-center pointer-events-none drop-shadow-lg truncate max-w-[90%] px-1 select-none">
                  {table.name}
                </span>
              )}

              {/* Resize handles */}
              {isSelected && resizeHandles.map(dir => (
                <div
                  key={dir}
                  data-handle={dir}
                  className={`absolute w-3 h-3 bg-purple-400 border-2 border-[#0a0a0f] rounded-sm z-10
                    ${dir === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                      dir === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                      dir === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' :
                      dir === 'se' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' :
                      dir === 'n' ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                      dir === 's' ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                      dir === 'w' ? 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize' :
                      'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize'}`}
                  onMouseDown={e => startResize(e, table, dir)}
                />
              ))}
            </div>
          );
        })}

        {/* Lasso rectangle */}
        {lasso && (
          <div
            className="absolute border border-purple-400/60 bg-purple-400/10 pointer-events-none z-50"
            style={{
              left: `${Math.min(lasso.x1, lasso.x2) * 100}%`,
              top: `${Math.min(lasso.y1, lasso.y2) * 100}%`,
              width: `${Math.abs(lasso.x2 - lasso.x1) * 100}%`,
              height: `${Math.abs(lasso.y2 - lasso.y1) * 100}%`,
            }}
          />
        )}
      </div>

      {/* ═══════════ SETTINGS MODAL ═══════════ */}
      {showSettings && selectedTable && (
        <SettingsModal
          table={selectedTable}
          multiCount={selectedIds.size}
          onUpdate={updateTable}
          onUpdateMulti={updateSelected}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ═══════════ MANAGER MODAL ═══════════ */}
      {showManager && (
        <ManagerModal
          tables={tables}
          selectedIds={selectedIds}
          onUpdate={updateTable}
          onSelect={setSelectedIds}
          onDelete={(id) => {
            setTables(prev => prev.filter(t => t.id !== id));
            setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
          }}
          onAdd={handleAdd}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SETTINGS MODAL — detailed config for selected block(s)
   ═══════════════════════════════════════════════════════ */
function SettingsModal({
  table,
  multiCount,
  onUpdate,
  onUpdateMulti,
  onClose,
}: {
  table: TableData;
  multiCount: number;
  onUpdate: (id: string, patch: Partial<TableData>) => void;
  onUpdateMulti: (patch: Partial<TableData>) => void;
  onClose: () => void;
}) {
  const isMulti = multiCount > 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#141420] border border-white/10 rounded-2xl p-5 w-[420px] max-w-[95vw] max-h-[85vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">
            {isMulti ? `Настройки (${multiCount} блоков)` : `Настройки: ${table.name}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          {!isMulti && (
            <Field label="Название">
              <input value={table.name} onChange={e => onUpdate(table.id, { name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm outline-none focus:border-purple-400" />
            </Field>
          )}

          {/* Position */}
          <Field label="Позиция (в долях 0..1)">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="X" value={table.x} min={0} max={1 - table.width} step={0.005}
                onChange={v => isMulti ? onUpdateMulti({ x: v }) : onUpdate(table.id, { x: v })} />
              <NumberInput label="Y" value={table.y} min={0} max={1 - table.height} step={0.005}
                onChange={v => isMulti ? onUpdateMulti({ y: v }) : onUpdate(table.id, { y: v })} />
            </div>
          </Field>

          {/* Size */}
          <Field label="Размер (в долях 0..1)">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Ширина" value={table.width} min={0.03} max={1} step={0.005}
                onChange={v => isMulti ? onUpdateMulti({ width: v }) : onUpdate(table.id, { width: v })} />
              <NumberInput label="Высота" value={table.height} min={0.03} max={1} step={0.005}
                onChange={v => isMulti ? onUpdateMulti({ height: v }) : onUpdate(table.id, { height: v })} />
            </div>
          </Field>

          {/* Color */}
          <Field label="Цвет">
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c.value}
                  onClick={() => isMulti ? onUpdateMulti({ color: c.value }) : onUpdate(table.id, { color: c.value })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center text-[10px] text-white/70 font-mono
                    ${table.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c.bg }}
                  title={c.label}
                >
                  {c.label[0]}
                </button>
              ))}
            </div>
          </Field>

          {/* Shape */}
          {!isMulti && (
            <Field label="Форма">
              <div className="flex gap-2">
                <button onClick={() => onUpdate(table.id, { shape: 'rect' })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all
                    ${table.shape === 'rect' ? 'border-purple-400 bg-purple-500/20 text-purple-300' : 'border-white/10 text-white/40 hover:text-white/60'}`}>
                  Прямоугольник
                </button>
                <button onClick={() => onUpdate(table.id, { shape: 'round' })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all
                    ${table.shape === 'round' ? 'border-purple-400 bg-purple-500/20 text-purple-300' : 'border-white/10 text-white/40 hover:text-white/60'}`}>
                  Круг
                </button>
              </div>
            </Field>
          )}
        </div>

        <button onClick={onClose}
          className="mt-5 w-full py-2 rounded-lg bg-white/5 text-white/50 text-xs font-semibold hover:bg-white/10 transition-colors">
          Готово
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MANAGER MODAL — compact list of all blocks
   ═══════════════════════════════════════════════════════ */
function ManagerModal({
  tables,
  selectedIds,
  onUpdate,
  onSelect,
  onDelete,
  onAdd,
  onClose,
}: {
  tables: TableData[];
  selectedIds: Set<string>;
  onUpdate: (id: string, patch: Partial<TableData>) => void;
  onSelect: (ids: Set<string>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#141420] border border-white/10 rounded-2xl p-5 w-[600px] max-w-[95vw] max-h-[85vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Все блоки ({tables.length})</h3>
          <div className="flex items-center gap-2">
            <button onClick={onAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors">
              <Plus size={12} /> Добавить
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_60px_60px_60px_60px_70px_36px] gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/25 font-mono border-b border-white/5 mb-1">
          <span>Название</span><span>X</span><span>Y</span><span>Ш</span><span>В</span><span>Цвет</span><span></span>
        </div>

        {/* Rows */}
        <div className="space-y-0.5">
          {tables.map(t => {
            const cs = getColorStyle(t.color);
            const isSel = selectedIds.has(t.id);
            return (
              <div key={t.id}
                className={`grid grid-cols-[1fr_60px_60px_60px_60px_70px_36px] gap-2 items-center px-3 py-2 rounded-lg transition-colors cursor-pointer
                  ${isSel ? 'bg-purple-500/10 border border-purple-500/20' : 'hover:bg-white/[0.02] border border-transparent'}`}
                onClick={() => {
                  if (isSel) {
                    const n = new Set(selectedIds);
                    n.delete(t.id);
                    onSelect(n);
                  } else {
                    onSelect(new Set([...selectedIds, t.id]));
                  }
                }}
              >
                {/* Name */}
                <input value={t.name} onClick={e => e.stopPropagation()}
                  onChange={e => onUpdate(t.id, { name: e.target.value })}
                  className="bg-transparent text-xs text-white outline-none border-b border-transparent focus:border-purple-400 truncate" />

                {/* X */}
                <input type="number" step="0.01" min="0" max="1" value={+t.x.toFixed(3)} onClick={e => e.stopPropagation()}
                  onChange={e => onUpdate(t.id, { x: clamp(parseFloat(e.target.value) || 0, 0, 1) })}
                  className="bg-black/20 rounded px-1.5 py-0.5 text-[10px] text-white/60 font-mono outline-none focus:text-white w-full" />

                {/* Y */}
                <input type="number" step="0.01" min="0" max="1" value={+t.y.toFixed(3)} onClick={e => e.stopPropagation()}
                  onChange={e => onUpdate(t.id, { y: clamp(parseFloat(e.target.value) || 0, 0, 1) })}
                  className="bg-black/20 rounded px-1.5 py-0.5 text-[10px] text-white/60 font-mono outline-none focus:text-white w-full" />

                {/* Width */}
                <input type="number" step="0.01" min="0.03" max="1" value={+t.width.toFixed(3)} onClick={e => e.stopPropagation()}
                  onChange={e => onUpdate(t.id, { width: clamp(parseFloat(e.target.value) || 0.03, 0.03, 1) })}
                  className="bg-black/20 rounded px-1.5 py-0.5 text-[10px] text-white/60 font-mono outline-none focus:text-white w-full" />

                {/* Height */}
                <input type="number" step="0.01" min="0.03" max="1" value={+t.height.toFixed(3)} onClick={e => e.stopPropagation()}
                  onChange={e => onUpdate(t.id, { height: clamp(parseFloat(e.target.value) || 0.03, 0.03, 1) })}
                  className="bg-black/20 rounded px-1.5 py-0.5 text-[10px] text-white/60 font-mono outline-none focus:text-white w-full" />

                {/* Color swatch */}
                <div className="flex gap-0.5">
                  {PRESET_COLORS.slice(0, 4).map(c => (
                    <button key={c.value} onClick={e => { e.stopPropagation(); onUpdate(t.id, { color: c.value }); }}
                      className={`w-4 h-4 rounded-full border transition-all ${t.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c.bg }}
                    />
                  ))}
                </div>

                {/* Delete */}
                <button onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                  className="p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors justify-self-end">
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-8 text-white/20 text-xs">Нет блоков. Добавьте первый.</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Small helpers ═══════════ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-white/30 font-mono mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="block text-[10px] text-white/25 mb-0.5">{label}</span>
      <input type="number" step={step} min={min} max={max} value={+value.toFixed(3)}
        onChange={e => onChange(clamp(parseFloat(e.target.value) || min, min, max))}
        className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs font-mono outline-none focus:border-purple-400" />
    </div>
  );
}
