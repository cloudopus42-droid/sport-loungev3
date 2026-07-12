import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { Mix } from '@/types';

export function MixesPage() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMix, setEditingMix] = useState<Mix | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [description, setDescription] = useState('');
  const [flavorsInput, setFlavorsInput] = useState('');
  const [flavors, setFlavors] = useState<string[]>([]);
  const [strength, setStrength] = useState(5);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('Основные');
  const [color, setColor] = useState('');

  const fetchMixes = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api('/api/mixes', { signal });
      setMixes(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Ошибка загрузки миксов', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchMixes(ac.signal);
    return () => ac.abort();
  }, [fetchMixes]);

  const openCreate = () => {
    resetForm();
    setEditingMix(null);
    setModalOpen(true);
  };

  const openEdit = (mix: Mix) => {
    setEditingMix(mix);
    setName(mix.name);
    setManufacturer(mix.manufacturer);
    setDescription(mix.description || '');
    setFlavors(mix.flavors);
    setStrength(mix.strength);
    setStatus(mix.status);
    setEmoji((mix as any).emoji || '');
    setCategory((mix as any).category || 'Основные');
    setColor((mix as any).color || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = { name, manufacturer, description, flavors, strength, status, emoji, category, color };

    try {
      if (editingMix) {
        await api(`/api/mixes/${editingMix._id}`, { method: 'PUT', body: payload });
        showToast('Микс обновлён', 'success');
      } else {
        await api('/api/mixes', { method: 'POST', body: payload });
        showToast('Микс добавлен', 'success');
      }
      setModalOpen(false);
      resetForm();
      fetchMixes();
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
      await api(`/api/mixes/${deleteTarget}`, { method: 'DELETE' });
      showToast('Микс удалён', 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchMixes();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setManufacturer('');
    setDescription('');
    setFlavors([]);
    setFlavorsInput('');
    setStrength(5);
    setStatus('active');
    setEmoji('');
    setCategory('Основные');
    setColor('');
    setEditingMix(null);
  };

  const addFlavor = () => {
    const trimmed = flavorsInput.trim();
    if (trimmed && !flavors.includes(trimmed)) {
      setFlavors([...flavors, trimmed]);
      setFlavorsInput('');
    }
  };

  const removeFlavor = (flavor: string) => {
    setFlavors(flavors.filter((f) => f !== flavor));
  };

  const handleFlavorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFlavor();
    }
  };

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'manufacturer', label: 'Производитель' },
    {
      key: 'flavors',
      label: 'Вкусы',
      render: (mix: Mix) => (
        <div className="flex flex-wrap gap-1">
          {mix.flavors.slice(0, 3).map((f) => (
            <Badge key={f} text={f} color="cyan" size="sm" />
          ))}
          {mix.flavors.length > 3 && (
            <Badge text={`+${mix.flavors.length - 3}`} color="gray" size="sm" />
          )}
        </div>
      ),
    },
    {
      key: 'strength',
      label: 'Крепость',
      render: (mix: Mix) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-dark-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-gold to-accent-gold rounded-full transition-all"
              style={{ width: `${(mix.strength / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/50">{mix.strength}/10</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
      render: (mix: Mix) => (
        <Badge
          text={mix.status === 'active' ? 'Активный' : 'Неактивный'}
          color={mix.status === 'active' ? 'green' : 'gray'}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (mix: Mix) => (
        <div className="flex items-center gap-1">
          <motion.button
            className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); openEdit(mix); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(mix._id); setDeleteDialogOpen(true); }}
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
          <h1 className="text-lg font-display font-bold text-white">Миксы</h1>
          <p className="text-xs text-white/40 mt-0">Управление табачными миксами</p>
        </div>
        <GlowButton onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Добавить микс
        </GlowButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={mixes} />
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingMix ? 'Редактировать микс' : 'Добавить микс'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Название</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Darkside Base" className="glass-input" required />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Производитель</label>
              <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Darkside" className="glass-input" required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание микса..." className="glass-input min-h-[80px] resize-none" rows={3} />
          </div>

          {/* Flavor display config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Эмодзи</label>
              <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🍏" className="glass-input" maxLength={4} />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Категория</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input">
                {['Фрукты', 'Ягоды', 'Десерт', 'Пряные', 'Свежие', 'Авторские', 'Основные'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Цвет</label>
              <div className="flex gap-1.5">
                <input type="color" value={color || '#FFBF00'} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#FFBF00" className="glass-input flex-1" />
              </div>
            </div>
          </div>

          {/* Flavors tag input */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Вкусы</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {flavors.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-gold/10 border border-accent-gold/20 text-xs text-accent-gold">
                  {f}
                  <button type="button" onClick={() => removeFlavor(f)} className="ml-0.5 hover:text-white">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={flavorsInput}
                onChange={(e) => setFlavorsInput(e.target.value)}
                onKeyDown={handleFlavorKeyDown}
                placeholder="Добавить вкус..."
                className="glass-input flex-1"
              />
              <GlowButton type="button" variant="secondary" size="sm" onClick={addFlavor}>
                Добавить
              </GlowButton>
            </div>
          </div>

          {/* Strength slider */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Крепость: {strength}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-dark-bg rounded-full appearance-none cursor-pointer accent-accent-gold"
            />
            <div className="flex justify-between text-[10px] text-white/20 mt-1">
              <span>Лёгкий</span>
              <span>Крепкий</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50 font-medium">Статус:</label>
            <button
              type="button"
              onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                status === 'active' ? 'bg-accent-gold/30' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                  status === 'active' ? 'left-[22px] bg-accent-gold' : 'left-0.5 bg-white/30'
                }`}
              />
            </button>
            <span className="text-xs text-white/40">{status === 'active' ? 'Активный' : 'Неактивный'}</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <GlowButton variant="secondary" type="button" onClick={() => { setModalOpen(false); resetForm(); }}>Отмена</GlowButton>
            <GlowButton type="submit" loading={saving}>{editingMix ? 'Сохранить' : 'Добавить'}</GlowButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Удалить микс"
        message="Вы уверены, что хотите удалить этот микс?"
        confirmText="Удалить"
        loading={deleting}
      />
    </div>
  );
}

