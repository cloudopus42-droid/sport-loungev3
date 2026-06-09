import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, GripVertical, Upload, Image, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
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

export function AdminShowcasePage() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', order: 0 });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/api/showcases')
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, imageUrl: data.url || data.imageUrl }));
      showToast('Фото загружено', 'success');
    } catch {
      showToast('Ошибка загрузки фото', 'error');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('Введите заголовок', 'error');
      return;
    }

    try {
      if (editing) {
        const { data } = await api.put(`/api/showcases/${editing}`, form);
        setItems((prev) => prev.map((i) => i.id === editing ? data : i));
        showToast('Обновлено', 'success');
      } else {
        const { data } = await api.post('/api/showcases', form);
        setItems((prev) => [...prev, data]);
        showToast('Создано', 'success');
      }
      closeForm();
    } catch {
      showToast('Ошибка сохранения', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить карточку?')) return;
    try {
      await api.delete(`/api/showcases/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Удалено', 'success');
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const startEdit = (item: ShowcaseItem) => {
    setEditing(item.id);
    setForm({ title: item.title, description: item.description, imageUrl: item.imageUrl, order: item.order });
    setPreviewUrl(item.imageUrl ? resolveImageUrl(item.imageUrl) : null);
    setShowForm(true);
  };

  const openNewForm = () => {
    setEditing(null);
    setForm({ title: '', description: '', imageUrl: '', order: items.length });
    setPreviewUrl(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', description: '', imageUrl: '', order: 0 });
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-accent-gold">Витрина</h1>
          <p className="text-sm text-white/40">Карточки на главной странице</p>
        </div>
        <GlowButton size="sm" onClick={openNewForm}>
          <Plus className="w-4 h-4" /> Добавить
        </GlowButton>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-accent-gold">
                  {editing ? 'Редактировать карточку' : 'Новая карточка'}
                </h3>
                <button onClick={closeForm} className="p-1 text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Заголовок карточки"
                className="glass-input text-sm"
              />

              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Описание"
                className="glass-input text-sm min-h-[80px] resize-none"
              />

              {/* Image upload area */}
              <div className="space-y-2">
                <label className="text-xs text-white/40 font-medium">Изображение</label>
                <div className="flex gap-4 items-start">
                  {/* Preview / Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-24 rounded-xl border border-dashed border-accent-gold/30 hover:border-accent-gold/60 flex items-center justify-center cursor-pointer transition-colors bg-white/[0.02] overflow-hidden"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
                    ) : previewUrl ? (
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-5 h-5 text-white/20 mx-auto" />
                        <span className="text-[10px] text-white/30 mt-1 block">Загрузить</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      value={form.imageUrl}
                      onChange={(e) => {
                        setForm({ ...form, imageUrl: e.target.value });
                        setPreviewUrl(e.target.value ? resolveImageUrl(e.target.value) : null);
                      }}
                      placeholder="Или вставьте URL изображения"
                      className="glass-input text-sm"
                    />
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                      placeholder="Порядок"
                      className="glass-input text-sm w-32"
                    />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <GlowButton onClick={handleSave} loading={uploading}>
                  {editing ? 'Сохранить' : 'Создать'}
                </GlowButton>
                <button
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Отмена
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-4">
          <Image className="w-12 h-12 text-white/10 mx-auto" />
          <div>
            <p className="text-sm text-white/40">Нет карточек витрины</p>
            <p className="text-xs text-white/20 mt-1">Нажмите «Добавить» чтобы создать первую карточку</p>
          </div>
          <GlowButton size="sm" onClick={openNewForm}>
            <Plus className="w-4 h-4" /> Создать карточку
          </GlowButton>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {items.sort((a, b) => a.order - b.order).map((item) => (
            <motion.div key={item.id} layout>
              <GlassCard className="p-4 flex items-center gap-4 hover:border-accent-gold/40 transition-colors">
                <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0 cursor-grab" />
                {item.imageUrl ? (
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    className="w-16 h-12 object-cover rounded-lg flex-shrink-0 border border-white/5"
                    alt=""
                  />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Image className="w-5 h-5 text-white/15" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-white/40 truncate">{item.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-2 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
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
