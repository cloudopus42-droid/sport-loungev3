import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, GripVertical, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileUploader } from '@/components/FileUploader';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';

interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

interface ShowcaseSettings {
  enabled: boolean;
  topCount: number;
  background: string;
}

const emptyForm = { title: '', description: '', imageUrl: '', order: 0 };

export function AdminShowcasePage() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [settings, setSettings] = useState<ShowcaseSettings>({ enabled: true, topCount: 6, background: 'dark' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const [data, settingsData] = await Promise.all([
        api('/api/showcases/manage'),
        api<ShowcaseSettings>('/api/showcases/settings'),
      ]);
      setItems(Array.isArray(data) ? data : data.data || []);
      if (settingsData) setSettings(settingsData);
    } catch {
      showToast('Ошибка загрузки витрины', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const saved = await api<ShowcaseSettings>('/api/showcases/settings', {
        method: 'PUT',
        body: settings,
      });
      setSettings(saved);
      showToast('Настройки витрины сохранены', 'success');
    } catch {
      showToast('Ошибка сохранения настроек', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchItems();
    return () => ac.abort();
  }, [fetchItems]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('order', String(form.order));
      if (file) formData.append('image', file);

      if (editing) {
        const result = await api(`/api/showcases/${editing}`, { method: 'PUT', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        setItems((prev) => prev.map((i) => i.id === editing ? result : i));
        showToast('Обновлено', 'success');
      } else {
        const result = await api('/api/showcases', { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        setItems((prev) => [...prev, result]);
        showToast('Создано', 'success');
      }
      setEditing(null);
      setShowForm(false);
      setForm(emptyForm);
      setFile(null);
    } catch {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api(`/api/showcases/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Удалено', 'success');
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const startEdit = (item: ShowcaseItem) => {
    setEditing(item.id);
    setForm({ title: item.title, description: item.description, imageUrl: item.imageUrl, order: item.order });
    setFile(null);
  };

  const cancelForm = () => {
    setEditing(null);
    setShowForm(false);
    setForm(emptyForm);
    setFile(null);
  };

  const sorted = [...items].sort((a, b) => a.order - b.order);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updated = reordered.map((item, idx) => ({ ...item, order: idx }));
    setItems(updated);
    api('/api/showcases/reorder', { method: 'PUT', body: updated.map(({ id, order }) => ({ id, order })) })
      .catch(() => showToast('Ошибка сохранения порядка', 'error'));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map(i => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await api('/api/showcases/bulk-delete', { method: 'POST', body: { ids: Array.from(selectedIds) } });
      showToast(`Удалено ${selectedIds.size} карточек`, 'success');
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchItems();
    } catch {
      showToast('Ошибка массового удаления', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-display font-bold text-white">Витрина</h1>
          <p className="text-xs text-white/40">Карточки на главной странице</p>
        </div>
        <GlowButton size="sm" onClick={() => { cancelForm(); setShowForm(true); setForm({ ...emptyForm, order: items.length }); }}>
          <Plus className="w-4 h-4" /> Добавить
        </GlowButton>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/30"
        >
          <span className="text-xs text-accent-gold font-medium">{selectedIds.size} выбрано</span>
          <button onClick={toggleSelectAll} className="text-xs text-white/50 hover:text-white/70 transition-colors">
            {selectedIds.size === sorted.length ? 'Снять все' : 'Выбрать все'}
          </button>
          <div className="flex-1" />
          <GlowButton size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Удалить ({selectedIds.size})
          </GlowButton>
          <button onClick={() => setSelectedIds(new Set())} className="text-white/40 hover:text-white/60 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      <GlassCard variant="premium" className="p-3 space-y-2">
        <h3 className="text-xs font-semibold text-white">Настройки витрины на главной</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="rounded border-glass-border"
            />
            Показывать витрину
          </label>
          <div>
            <label className="text-xs text-white/50 block mb-1">Кол-во карточек (top mixes)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.topCount}
              onChange={(e) => setSettings({ ...settings, topCount: Number(e.target.value) })}
              className="glass-input text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Фон секции</label>
            <select
              value={settings.background}
              onChange={(e) => setSettings({ ...settings, background: e.target.value })}
              className="glass-input text-sm w-full"
            >
              <option value="dark">Тёмный</option>
              <option value="gold">Золотое свечение</option>
              <option value="smoke">Дымка</option>
            </select>
          </div>
        </div>
        <GlowButton size="sm" onClick={saveSettings} loading={settingsSaving}>
          Сохранить настройки
        </GlowButton>
      </GlassCard>

      {/* Form */}
      {(showForm || editing !== null) && (
        <GlassCard variant="premium" className="p-3 space-y-2">
          <h3 className="text-xs font-semibold text-white">
            {editing ? 'Редактировать карточку' : 'Новая карточка'}
          </h3>

          <FileUploader onFileSelect={setFile} accept="image/*" />

          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Заголовок" className="glass-input text-sm" />

          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание" className="glass-input text-sm min-h-[80px]" />

          <div className="flex items-center gap-3">
            <label className="text-[10px] text-white/50 font-medium">Порядок:</label>
            <input type="number" min={0} value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="glass-input text-sm w-24" />
          </div>

          <div className="flex gap-2">
            <GlowButton onClick={handleSave} loading={saving}>
              {editing ? 'Сохранить' : 'Создать'}
            </GlowButton>
            <GlowButton variant="secondary" onClick={cancelForm}>Отмена</GlowButton>
          </div>
        </GlassCard>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard variant="premium" className="p-6 text-center">
          <p className="text-sm text-white/40">Нет карточек витрины</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sorted.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => { if (dragIndex !== null && dragIndex !== index) moveItem(dragIndex, index); setDragIndex(null); }}
            >
              <GlassCard variant="premium" className={`p-0 overflow-hidden transition-all ${selectedIds.has(item.id) ? 'ring-2 ring-accent-gold/60' : ''}`}>
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                  <label className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-md border-2 border-white/30 peer-checked:border-accent-gold peer-checked:bg-accent-gold/20 flex items-center justify-center transition-all bg-black/40 backdrop-blur-sm">
                      {selectedIds.has(item.id) && (
                        <svg className="w-3 h-3 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                  <div className="cursor-grab active:cursor-grabbing p-1 rounded-lg bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white/60" />
                  </div>
                </div>
                <div className="h-36 sm:h-44 bg-dark-surface overflow-hidden">
                  {item.imageUrl ? (
                    <img src={resolveImageUrl(item.imageUrl)}
                      className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 text-sm">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-white/40 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-white/20">#{item.order}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Удалить ${selectedIds.size} карточек?`}
        message={`Вы уверены, что хотите удалить ${selectedIds.size} карточек витрины? Это действие необратимо.`}
        confirmText={`Удалить ${selectedIds.size}`}
        loading={bulkDeleting}
      />
    </div>
  );
}

