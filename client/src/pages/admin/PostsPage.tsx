import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileUploader } from '@/components/FileUploader';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { Post } from '@/types';
import { resolveImageUrl } from '@/lib/urls';

export function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/posts', { params: { limit: 100 } });
      setPosts(data.posts || data);
    } catch {
      showToast('Ошибка загрузки постов', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Выберите изображение', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('image', file);

      await api.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Пост создан', 'success');
      setModalOpen(false);
      resetForm();
      fetchPosts();
    } catch {
      showToast('Ошибка создания поста', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${deleteTarget}`);
      showToast('Пост удалён', 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchPosts();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => api.delete(`/api/posts/${id}`))
      );
      showToast(`Удалено постов: ${selectedIds.size}`, 'success');
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      fetchPosts();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p._id)));
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Фото',
      render: (post: Post) => (
        <div className="w-[50px] h-[50px] rounded-lg overflow-hidden bg-dark-surface flex-shrink-0">
          {post.imageUrl ? (
            <img src={resolveImageUrl(post.imageUrl)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white/20" />
            </div>
          )}
        </div>
      ),
    },
    { key: 'title', label: 'Заголовок' },
    {
      key: 'createdAt',
      label: 'Дата',
      render: (post: Post) =>
        new Date(post.createdAt).toLocaleDateString('ru-RU'),
    },
    {
      key: 'likesCount',
      label: 'Лайки',
      render: (post: Post) => (
        <span className="text-accent-cyan">{post.likes || 0}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (post: Post) => (
        <motion.button
          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(post._id);
            setDeleteDialogOpen(true);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Посты</h1>
          <p className="text-sm text-white/40 mt-0.5">Управление публикациями</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <GlowButton
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Удалить ({selectedIds.size})
            </GlowButton>
          )}
          <GlowButton onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Создать пост
          </GlowButton>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={posts}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
          />
        )}
      </motion.div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Создать пост" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <FileUploader onFileSelect={setFile} accept="image/*" />
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Заголовок поста"
              className="glass-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание поста..."
              className="glass-input min-h-[100px] resize-none"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <GlowButton variant="secondary" type="button" onClick={() => { setModalOpen(false); resetForm(); }}>
              Отмена
            </GlowButton>
            <GlowButton type="submit" loading={saving}>
              Создать
            </GlowButton>
          </div>
        </form>
      </Modal>

      {/* Delete single */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Удалить пост"
        message="Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить."
        confirmText="Удалить"
        loading={deleting}
      />

      {/* Bulk delete */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Удалить выбранные"
        message={`Вы уверены, что хотите удалить ${selectedIds.size} постов?`}
        confirmText="Удалить все"
        loading={deleting}
      />
    </div>
  );
}
