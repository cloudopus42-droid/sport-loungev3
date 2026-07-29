import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, RotateCcw } from 'lucide-react';
import { showToast } from '@/components/NotificationToast';

interface TableData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_SIZE = 0.04;

function generateId() {
  return `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_TABLES: TableData[] = [
  { id: 'tbl-1', name: 'VIP-1',  x: 0.04, y: 0.06, width: 0.20, height: 0.18 },
  { id: 'tbl-2', name: 'VIP-2',  x: 0.27, y: 0.06, width: 0.20, height: 0.18 },
  { id: 'tbl-3', name: 'Стол 3', x: 0.52, y: 0.06, width: 0.18, height: 0.14 },
  { id: 'tbl-4', name: 'Стол 4', x: 0.73, y: 0.06, width: 0.18, height: 0.14 },
  { id: 'tbl-5', name: 'Барная', x: 0.04, y: 0.38, width: 0.34, height: 0.12 },
  { id: 'tbl-6', name: 'Стол 6', x: 0.43, y: 0.38, width: 0.16, height: 0.18 },
  { id: 'tbl-7', name: 'Стол 7', x: 0.63, y: 0.38, width: 0.16, height: 0.18 },
  { id: 'tbl-8', name: 'Лаунж',  x: 0.04, y: 0.66, width: 0.38, height: 0.22 },
  { id: 'tbl-9', name: 'Стол 9', x: 0.48, y: 0.66, width: 0.20, height: 0.22 },
  { id: 'tbl-10', name: 'Стол 10', x: 0.72, y: 0.66, width: 0.22, height: 0.22 },
];

export function FloorMapEditor() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load from server on mount
  useEffect(() => {
    fetch('/api/floor-map')
      .then(r => r.json())
      .then(data => {
        if (data.tables && Array.isArray(data.tables) && data.tables.length > 0) {
          setTables(data.tables);
        } else {
          setTables(DEFAULT_TABLES);
        }
      })
      .catch(() => setTables(DEFAULT_TABLES))
      .finally(() => setLoading(false));
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const pxToFrac = (px: number, dim: number) => px / dim;

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
    };
    setTables(prev => [...prev, newTable]);
    setSelectedId(newTable.id);
  }, [tables.length]);

  // ── Delete ──
  const handleDelete = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setSelectedId(null);
  }, []);

  // ── Clear all ──
  const handleClear = useCallback(() => {
    if (!confirm('Удалить все столы?')) return;
    setTables([]);
    setSelectedId(null);
  }, []);

  // ── Drag ──
  const startDrag = useCallback((e: React.MouseEvent, table: TableData) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = table.x;
    const origY = table.y;

    const onMove = (ev: MouseEvent) => {
      const dx = pxToFrac(ev.clientX - startX, rect.width);
      const dy = pxToFrac(ev.clientY - startY, rect.height);
      setTables(prev => prev.map(t =>
        t.id === table.id
          ? { ...t, x: clamp(origX + dx, 0, 1 - t.width), y: clamp(origY + dy, 0, 1 - t.height) }
          : t
      ));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // ── Resize ──
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

      setTables(prev => prev.map(t =>
        t.id === table.id ? { ...t, x: newX, y: newY, width: newW, height: newH } : t
      ));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // ── Rename ──
  const commitRename = useCallback(() => {
    if (editingId) {
      const val = editName.trim();
      if (val) {
        setTables(prev => prev.map(t => t.id === editingId ? { ...t, name: val } : t));
      }
      setEditingId(null);
    }
  }, [editingId, editName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={14} /> Добавить стол
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить и Опубликовать'}
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:text-red-400 hover:border-red-400/30 transition-all"
        >
          <Trash2 size={14} /> Очистить
        </button>
        <span className="ml-auto text-xs text-white/30 font-mono">{tables.length} столов</span>
      </div>

      {/* Canvas */}
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
        onClick={e => { if (e.target === canvasRef.current) setSelectedId(null); }}
      >
        {tables.map(table => (
          <div
            key={table.id}
            className={`absolute flex items-center justify-center rounded-lg border-2 transition-shadow cursor-grab active:cursor-grabbing
              ${selectedId === table.id
                ? 'border-purple-400 bg-purple-500/30 shadow-[0_0_0_3px_rgba(168,85,247,0.3)]'
                : 'border-purple-500/40 bg-purple-500/20 hover:border-purple-400/60'}`}
            style={{
              left: `${table.x * 100}%`,
              top: `${table.y * 100}%`,
              width: `${table.width * 100}%`,
              height: `${table.height * 100}%`,
            }}
            onMouseDown={e => {
              if ((e.target as HTMLElement).classList.contains('resize-handle') || (e.target as HTMLElement).classList.contains('del-btn')) return;
              setSelectedId(table.id);
              startDrag(e, table);
            }}
            onDoubleClick={e => {
              e.stopPropagation();
              setEditingId(table.id);
              setEditName(table.name);
            }}
          >
            {/* Label */}
            {editingId === table.id ? (
              <input
                ref={editInputRef}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                className="bg-black/40 border border-purple-400 rounded px-2 py-0.5 text-xs text-white text-center w-24 outline-none"
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                maxLength={30}
              />
            ) : (
              <span className="text-xs sm:text-sm font-bold text-white/90 text-center pointer-events-none drop-shadow-lg truncate max-w-[90%] px-1">
                {table.name}
              </span>
            )}

            {/* Delete button */}
            {selectedId === table.id && (
              <div
                className="del-btn absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0a0f] flex items-center justify-center text-white text-[10px] cursor-pointer hover:scale-110 z-10"
                onClick={e => { e.stopPropagation(); handleDelete(table.id); }}
                onMouseDown={e => e.stopPropagation()}
              >
                ×
              </div>
            )}

            {/* Resize handles */}
            {selectedId === table.id && resizeHandles.map(dir => (
              <div
                key={dir}
                className={`resize-handle absolute w-3 h-3 bg-purple-400 border-2 border-[#0a0a0f] rounded-sm z-10
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
        ))}
      </div>

      {/* JSON Preview */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-4 max-h-48 overflow-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">JSON конфигурация</p>
        <pre className="text-[11px] text-white/40 font-mono whitespace-pre-wrap break-all">
          {JSON.stringify(tables, null, 2)}
        </pre>
      </div>
    </div>
  );
}
