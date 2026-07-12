import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileUploader } from '@/components/FileUploader';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { Promo } from '@/types';

export function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState('#00f2fe');
  const [priority, setPriority] = useState(0);
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const fetchPromos = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api('/api/promos', { signal });
      setPromos(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Ошибка загрузки акций', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchPromos(ac.signal);
    return () => ac.abort();
  }, [fetchPromos]);

  const openCreate = () => {
    resetForm();
    setEditingPromo(null);
    setModalOpen(true);
  };

  const openEdit = (promo: Promo) => {
    setEditingPromo(promo);
    setTitle(promo.title);
    setDescription(promo.description);
    setDiscount(promo.discountPercent || 0);
    setStartDate(promo.startDate?.slice(0, 10) || '');
    setEndDate(promo.endDate?.slice(0, 10) || '');
    setColor(promo.badgeColor || '#00f2fe');
    setPriority(promo.priority);
    setActive(promo.isActive);
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
      formData.append('discountPercent', String(discount));
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('badgeColor', color);
      formData.append('priority', String(priority));
      formData.append('isActive', String(active));
      if (file) formData.append('image', file);

      if (editingPromo) {
        await api(`/api/promos/${editingPromo._id}`, { method: 'PUT', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Акция обновлена', 'success');
      } else {
        await api('/api/promos', { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Акция создана', 'success');
      }
      setModalOpen(false);
      resetForm();
      fetchPromos();
    } catch {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/promos/${deleteTarget}`, { method: 'DELETE' });
      showToast('Акция удалена', 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchPromos();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDiscount(10);
    setStartDate('');
    setEndDate('');
    setColor('#00f2fe');
    setPriority(0);
    setActive(true);
    setFile(null);
    setEditingPromo(null);
  };

  const columns = [
    {
      key: 'image',
      label: 'Фото',
      render: (promo: Promo) => (
        <div className="w-[50px] h-[50px] rounded-lg overflow-hidden bg-dark-surface flex-shrink-0">
          {promo.imageUrl ? (
            <img src={promo.imageUrl} alt="" className="w-full h-full object-cover" />
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
      key: 'discount',
      label: 'Скидка',
      render: (promo: Promo) => (
        <span className="text-accent-gold font-semibold">-{promo.discountPercent}%</span>
      ),
    },
    {
      key: 'dates',
      label: 'Период',
      render: (promo: Promo) => (
        <span className="text-xs text-white/50">
          {promo.startDate ? new Date(promo.startDate).toLocaleDateString('ru-RU') : '—'}
          {' — '}
          {promo.endDate ? new Date(promo.endDate).toLocaleDateString('ru-RU') : '—'}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Статус',
      render: (promo: Promo) => (
        <Badge
          text={promo.isActive ? 'Активна' : 'Неактивна'}
          color={promo.isActive ? 'green' : 'gray'}
        />
      ),
    },
    {
      key: 'priority',
      label: 'Приоритет',
      render: (promo: Promo) => (
        <span className="text-white/50">{promo.priority}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (promo: Promo) => (
        <div className="flex items-center gap-1">
          <motion.button
            className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); openEdit(promo); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(promo._id); setDeleteDialogOpen(true); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
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
          <h1 className="text-lg font-display font-bold text-white">Акции</h1>
          <p className="text-xs text-white/40 mt-0">Управление промо-акциями</p>
        </div>
        <GlowButton onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Создать акцию
        </GlowButton>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={promos} />
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingPromo ? 'Редактировать акцию' : 'Создать акцию'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-2">
          <FileUploader onFileSelect={setFile} accept="image/*" />

          <div>
            <label className="block text-[10px] text-white/50 mb-1 font-medium">Название</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Счастливые часы" className="glass-input" required />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание акции..." className="glass-input min-h-[80px] resize-none" rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Скидка (%)</label>
              <input type="number" min={1} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="glass-input" required />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Начало</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass-input" required />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Окончание</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="glass-input" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Цвет</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-glass-border bg-transparent cursor-pointer"
                />
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="glass-input flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Приоритет</label>
              <input type="number" min={0} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="glass-input" />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/50 font-medium">Активна:</label>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-accent-gold/30' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${active ? 'left-[22px] bg-accent-gold' : 'left-0.5 bg-white/30'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <GlowButton variant="secondary" type="button" onClick={() => { setModalOpen(false); resetForm(); }}>Отмена</GlowButton>
            <GlowButton type="submit" loading={saving}>{editingPromo ? 'Сохранить' : 'Создать'}</GlowButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Удалить акцию"
        message="Вы уверены, что хотите удалить эту акцию?"
        confirmText="Удалить"
        loading={deleting}
      />
    </div>
  );
}

