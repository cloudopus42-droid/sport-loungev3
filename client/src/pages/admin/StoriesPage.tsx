import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Film } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileUploader } from '@/components/FileUploader';
import { Badge } from '@/components/ui/Badge';
import { DragDropList } from '@/components/DragDropList';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { Story } from '@/types';
import { resolveImageUrl } from '@/lib/urls';

export function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(5);
  const [storyActive, setStoryActive] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const { data } = await api.get('/api/stories');
      const arr = Array.isArray(data) ? data : data.data || [];
      setStories(arr.sort((a: Story, b: Story) => a.sortOrder - b.sortOrder));
    } catch {
      showToast('Ошибка загрузки сторис', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Выберите файл', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('durationSeconds', String(duration));
      formData.append('isActive', String(storyActive));

      await api.post('/api/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Сторис добавлена', 'success');
      setModalOpen(false);
      resetForm();
      fetchStories();
    } catch {
      showToast('Ошибка создания', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/stories/${deleteTarget}`);
      showToast('Сторис удалена', 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchStories();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (newStories: Story[]) => {
    setStories(newStories);
    try {
      const order = newStories.map((s, i) => ({ id: s._id, order: i }));
      await api.put('/api/stories/reorder', { order });
    } catch {
      showToast('Ошибка сохранения порядка', 'error');
      fetchStories();
    }
  };

  const toggleStoryActive = async (story: Story) => {
    try {
      await api.put(`/api/stories/${story._id}`, { isActive: !story.isActive });
      setStories((prev) =>
        prev.map((s) => (s._id === story._id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch {
      showToast('Ошибка обновления', 'error');
    }
  };

  const resetForm = () => {
    setFile(null);
    setDuration(5);
    setStoryActive(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Сторис</h1>
          <p className="text-sm text-white/40 mt-0.5">Управление историями</p>
        </div>
        <GlowButton onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          Добавить сторис
        </GlowButton>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-full bg-glass-bg border border-glass-border flex items-center justify-center mb-4">
              <Film className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40">Нет сторис. Добавьте первую!</p>
          </div>
        ) : (
          <DragDropList
            items={stories}
            onReorder={handleReorder}
            renderItem={(story) => (
              <div className="flex items-center gap-4 w-full">
                {/* Preview */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-surface flex-shrink-0">
                  {story.mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-accent-gold/10">
                      <Film className="w-6 h-6 text-accent-gold" />
                    </div>
                  ) : (
                    <img
                      src={resolveImageUrl(story.mediaUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <Badge
                    text={story.mediaType === 'video' ? 'Видео' : 'Фото'}
                    color={story.mediaType === 'video' ? 'purple' : 'blue'}
                    size="sm"
                  />
                  <span className="text-xs text-white/40">{story.durationSeconds}с</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStoryActive(story); }}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      story.isActive ? 'bg-accent-cyan/30' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      story.isActive ? 'left-[18px] bg-accent-cyan' : 'left-0.5 bg-white/30'
                    }`} />
                  </button>
                  <motion.button
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(story._id); setDeleteDialogOpen(true); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            )}
          />
        )}
      </motion.div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Добавить сторис" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <FileUploader onFileSelect={setFile} accept="image/*,video/*" />

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Длительность: {duration}с</label>
            <input
              type="range"
              min={3}
              max={30}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-1.5 bg-dark-bg rounded-full appearance-none cursor-pointer accent-accent-cyan"
            />
            <div className="flex justify-between text-[10px] text-white/20 mt-1">
              <span>3с</span>
              <span>30с</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50 font-medium">Активна:</label>
            <button
              type="button"
              onClick={() => setStoryActive(!storyActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${storyActive ? 'bg-accent-cyan/30' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${storyActive ? 'left-[22px] bg-accent-cyan shadow-glow-cyan' : 'left-0.5 bg-white/30'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <GlowButton variant="secondary" type="button" onClick={() => { setModalOpen(false); resetForm(); }}>Отмена</GlowButton>
            <GlowButton type="submit" loading={saving}>Добавить</GlowButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Удалить сторис"
        message="Вы уверены, что хотите удалить эту сторис?"
        confirmText="Удалить"
        loading={deleting}
      />
    </div>
  );
}
