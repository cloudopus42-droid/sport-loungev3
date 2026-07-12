import clsx from 'clsx';
import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface TableProps<T extends { _id: string }> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

export function Table<T extends { _id: string }>({
  columns,
  data,
  onRowClick,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: TableProps<T>) {
  const hasSelection = !!selectedIds && !!onToggleSelect;
  const allSelected = hasSelection && data.length > 0 && data.every((item) => selectedIds.has(item._id));

  if (data.length === 0) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-glass-border">
        <div className="px-4 py-12 text-center text-white/40">Нет данных</div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-glass-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border bg-glass-bg">
              {hasSelection && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded border-glass-border bg-glass-bg text-accent-gold focus:ring-accent-gold/50 focus:ring-offset-0 cursor-pointer accent-accent-gold"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item._id}
                className={clsx(
                  'border-b border-glass-border/50 transition-colors duration-200',
                  'hover:bg-accent-gold/5',
                  onRowClick && 'cursor-pointer',
                  hasSelection && selectedIds.has(item._id) && 'bg-accent-gold/10'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {hasSelection && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item._id)}
                      onChange={() => onToggleSelect(item._id)}
                      className="w-4 h-4 rounded border-glass-border bg-glass-bg text-accent-gold focus:ring-accent-gold/50 focus:ring-offset-0 cursor-pointer accent-accent-gold"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-white/80">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {hasSelection && (
          <div className="flex items-center gap-2 px-1 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-glass-border bg-glass-bg text-accent-gold focus:ring-accent-gold/50 focus:ring-offset-0 cursor-pointer accent-accent-gold"
            />
            <span className="text-xs text-white/40">Выбрать все</span>
          </div>
        )}
        {data.map((item) => (
          <div
            key={item._id}
            className={clsx(
              'rounded-2xl border border-glass-border p-3 transition-colors duration-200',
              'hover:bg-accent-gold/5',
              onRowClick && 'cursor-pointer',
              hasSelection && selectedIds.has(item._id) && 'bg-accent-gold/10'
            )}
            onClick={() => onRowClick?.(item)}
          >
            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  {hasSelection && idx === 0 && (
                    <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item._id)}
                        onChange={() => onToggleSelect(item._id)}
                        className="w-4 h-4 rounded border-glass-border bg-glass-bg text-accent-gold focus:ring-accent-gold/50 focus:ring-offset-0 cursor-pointer accent-accent-gold"
                      />
                    </div>
                  )}
                  <span className="text-[11px] text-white/40 uppercase tracking-wider min-w-[60px] shrink-0">
                    {col.label}
                  </span>
                  <span className="text-sm text-white/80 text-right min-w-0">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
