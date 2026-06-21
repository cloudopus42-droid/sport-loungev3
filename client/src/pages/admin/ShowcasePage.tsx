import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, GripVertical } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/FileUploader';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';

interface ShowcaseItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

const emptyForm = { title: '', description: '', imageUrl: '', order: 0 };

export function AdminShowcasePage() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await api.get('/api/showcases');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      showToast('Ошибка загрузки витрины', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
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
        const { data } = await api.put(`/api/showcases/${editing}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setItems((prev) => prev.map((i) => i._id === editing ? data : i));
        showToast('Обновлено', 'success');
      } else {
        const { data } = await api.post('/api/showcases', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setItems((prev) => [...prev, data]);
        showToast('Создано', 'success');
      }
      setEditing(null);
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
      await api.delete(`/api/showcases/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      showToast('Удалено', 'success');
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const startEdit = (item: ShowcaseItem) => {
    setEditing(item._id);
    setForm({ title: item.title, description: item.description, imageUrl: item.imageUrl, order: item.order });
    setFile(null);
  };

  const cancelForm = () => {
    setEditing(null);
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
    api.put('/api/showcases/reorder', updated.map(({ _id, order }) => ({ _id, order })))
      .catch(() => showToast('Ошибка сохранения порядка', 'error'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Витрина</h1>
          <p className="text-sm text-white/40">Карточки на главной странице</p>
        </div>
        <GlowButton size="sm" onClick={() => { cancelForm(); setForm({ ...emptyForm, order: items.length }); }}>
          <Plus className="w-4 h-4" /> Добавить
        </GlowButton>
      </div>

      {/* Form */}
      {(editing !== null || form.title || form.description || file) && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            {editing ? 'Редактировать карточку' : 'Новая карточка'}
          </h3>

          <FileUploader onFileSelect={setFile} accept="image/*" />

          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Заголовок" className="glass-input text-sm" />

          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание" className="glass-input text-sm min-h-[80px]" />

          <div className="flex items-center gap-4">
            <label className="text-xs text-white/50 font-medium">Порядок:</label>
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
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-white/40">Нет карточек витрины</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((item, index) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => { if (dragIndex !== null && dragIndex !== index) moveItem(dragIndex, index); setDragIndex(null); }}
            >
              <GlassCard className="p-0 overflow-hidden">
                <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-lg bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white/60" />
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
                      <button onClick={() => handleDelete(item._id)}
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
    </div>
  );
}

