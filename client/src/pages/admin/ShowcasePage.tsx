import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, GripVertical } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
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

export function AdminShowcasePage() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', order: 0 });

  useEffect(() => {
    api.get('/api/showcases').then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        const { data } = await api.put(`/api/showcases/${editing}`, form);
        setItems((prev) => prev.map((i) => i._id === editing ? data : i));
        showToast('Обновлено', 'success');
      } else {
        const { data } = await api.post('/api/showcases', form);
        setItems((prev) => [...prev, data]);
        showToast('Создано', 'success');
      }
      setEditing(null);
      setForm({ title: '', description: '', imageUrl: '', order: 0 });
    } catch { showToast('Ошибка', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/showcases/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      showToast('Удалено', 'success');
    } catch {}
  };

  const startEdit = (item: ShowcaseItem) => {
    setEditing(item._id);
    setForm({ title: item.title, description: item.description, imageUrl: item.imageUrl, order: item.order });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Витрина</h1>
          <p className="text-sm text-white/40">Карточки на главной странице</p>
        </div>
        <GlowButton size="sm" onClick={() => { setEditing(null); setForm({ title: '', description: '', imageUrl: '', order: items.length }); }}>
          <Plus className="w-4 h-4" /> Добавить
        </GlowButton>
      </div>

      {/* Form */}
      {(editing !== null || form.title || form.description) && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">{editing ? 'Редактировать' : 'Новая карточка'}</h3>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Заголовок" className="glass-input text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание" className="glass-input text-sm min-h-[80px]" />
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="URL изображения (или путь /uploads/...)" className="glass-input text-sm" />
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            placeholder="Порядок" className="glass-input text-sm w-24" />
          <div className="flex gap-2">
            <GlowButton onClick={handleSave}>Сохранить</GlowButton>
            <button onClick={() => { setEditing(null); setForm({ title: '', description: '', imageUrl: '', order: 0 }); }}
              className="px-4 py-2 text-sm text-white/40 hover:text-white">Отмена</button>
          </div>
        </GlassCard>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-white/40">Нет карточек витрины</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {items.sort((a, b) => a.order - b.order).map((item) => (
            <motion.div key={item._id} layout>
              <GlassCard className="p-4 flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
                {item.imageUrl && (
                  <img src={resolveImageUrl(item.imageUrl)}
                    className="w-16 h-12 object-cover rounded-lg flex-shrink-0" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-white/40 truncate">{item.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(item)} className="p-2 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

