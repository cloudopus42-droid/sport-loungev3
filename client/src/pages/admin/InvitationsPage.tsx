import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Send, Image as ImageIcon } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileUploader } from '@/components/FileUploader';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import type { Invitation } from '@/types';

export function AdminInvitationsPage() {
  const { socket } = useSocket();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState<Invitation | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchInvitations = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api('/api/invitations', { signal });
      setInvitations(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Ошибка загрузки приглашений', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchInvitations(ac.signal);
    return () => ac.abort();
  }, [fetchInvitations]);

  const openCreate = () => {
    resetForm();
    setEditingInvitation(null);
    setModalOpen(true);
  };

  const openEdit = (inv: Invitation) => {
    setEditingInvitation(inv);
    setTitle(inv.title);
    setDescription(inv.description);
    setDate(inv.dateTime ? new Date(inv.dateTime).toISOString().slice(0, 10) : '');
    setTime(inv.dateTime ? new Date(inv.dateTime).toTimeString().slice(0, 5) : '');
    setLocation(inv.location || '');
    setFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('dateTime', date && time ? new Date(`${date}T${time}`).toISOString() : '');
      formData.append('location', location);
      if (file) formData.append('image', file);

      if (editingInvitation) {
        await api(`/api/invitations/${editingInvitation._id}`, { method: 'PUT', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Приглашение обновлено', 'success');
      } else {
        await api('/api/invitations', { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Приглашение создано', 'success');
      }
      setModalOpen(false);
      resetForm();
      fetchInvitations();
    } catch {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    setPublishing(true);
    try {
      await api(`/api/invitations/${publishTarget._id}`, { method: 'PUT', body: { status: 'published' } });

      // Emit socket event
      if (socket) {
        socket.emit('invitation:publish', publishTarget);
      }

      showToast('Приглашение опубликовано', 'success');
      setPublishDialogOpen(false);
      setPublishTarget(null);
      fetchInvitations();
    } catch {
      showToast('Ошибка публикации', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/invitations/${deleteTarget}`, { method: 'DELETE' });
      showToast('Приглашение удалено', 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchInvitations();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setFile(null);
    setEditingInvitation(null);
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
    if (selectedIds.size === invitations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invitations.map(i => i._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await api('/api/invitations/bulk-delete', { method: 'POST', body: { ids: Array.from(selectedIds) } });
      showToast(`Удалено ${selectedIds.size} приглашений`, 'success');
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchInvitations();
    } catch {
      showToast('Ошибка массового удаления', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Фото',
      render: (inv: Invitation) => (
        <div className="w-[50px] h-[50px] rounded-lg overflow-hidden bg-dark-surface flex-shrink-0">
          {inv.imageUrl ? (
            <img src={inv.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white/20" />
            </div>
          )}
        </div>
      ),
    },
    { key: 'title', label: 'Название' },
    {
      key: 'date',
      label: 'Дата/Время',
      render: (inv: Invitation) => (
        <span className="text-xs text-white/50">
          {inv.dateTime ? new Date(inv.dateTime).toLocaleDateString('ru-RU') : '—'}
          {inv.dateTime && ` ${new Date(inv.dateTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
        </span>
      ),
    },
    { key: 'location', label: 'Место' },
    {
      key: 'participants',
      label: 'Участники',
      render: (inv: Invitation) => (
        <span className="text-accent-gold">{inv.currentParticipants || 0}</span>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
      render: (inv: Invitation) => (
        <Badge
          text={inv.status === 'published' ? 'Опубликовано' : 'Черновик'}
          color={inv.status === 'published' ? 'green' : 'yellow'}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (inv: Invitation) => (
        <div className="flex items-center gap-1">
          {inv.status === 'draft' && (
            <button
              className="p-1.5 rounded-lg text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setPublishTarget(inv); setPublishDialogOpen(true); }}
              title="Опубликовать"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); openEdit(inv); }}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv._id); setDeleteDialogOpen(true); }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-lg font-display font-bold text-white">Приглашения</h1>
          <p className="text-xs text-white/40 mt-0">Управление приглашениями на мероприятия</p>
        </div>
        <GlowButton onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Создать приглашение
        </GlowButton>
      </motion.div>

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/30"
        >
          <span className="text-xs text-accent-gold font-medium">{selectedIds.size} выбрано</span>
          <GlowButton size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Удалить ({selectedIds.size})
          </GlowButton>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/40 hover:text-white/60 transition-colors">Снять</button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={invitations}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
          />
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingInvitation ? 'Редактировать приглашение' : 'Создать приглашение'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-2">
          <FileUploader onFileSelect={setFile} accept="image/*" />

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Название</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Вечеринка в SPORT LOUNGE" className="glass-input" required />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание мероприятия..." className="glass-input min-h-[80px] resize-none" rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Дата</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input" required />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Время</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="glass-input" required />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Место</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="SPORT LOUNGE" className="glass-input" required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <GlowButton variant="secondary" type="button" onClick={() => { setModalOpen(false); resetForm(); }}>Отмена</GlowButton>
            <GlowButton type="submit" loading={saving}>{editingInvitation ? 'Сохранить' : 'Создать'}</GlowButton>
          </div>
        </form>
      </Modal>

      {/* Publish confirm */}
      <ConfirmDialog
        isOpen={publishDialogOpen}
        onClose={() => { setPublishDialogOpen(false); setPublishTarget(null); }}
        onConfirm={handlePublish}
        title="Опубликовать приглашение"
        message="Опубликовать и разослать уведомления? Все подключённые пользователи получат уведомление."
        confirmText="Опубликовать"
        variant="warning"
        loading={publishing}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Удалить приглашение"
        message="Вы уверены, что хотите удалить это приглашение?"
        confirmText="Удалить"
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Удалить ${selectedIds.size} приглашений?`}
        message={`Вы уверены, что хотите удалить ${selectedIds.size} приглашений? Это действие необратимо.`}
        confirmText={`Удалить ${selectedIds.size}`}
        loading={bulkDeleting}
      />
    </div>
  );
}

