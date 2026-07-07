import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Package, ClipboardList, Settings,
  ChevronUp, ChevronDown, CheckCircle2, XCircle,
  Filter, RefreshCw,
} from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { FileUploader } from '@/components/FileUploader';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';

type Tab = 'items' | 'stock' | 'restock';

interface TobaccoItem {
  _id: string;
  id?: string;
  name: string;
  brand?: string;
  flavor?: string;
  description?: string;
  image_url?: string;
  price?: number;
  stock_quantity: number;
  unit?: string;
  weight_grams?: number;
  is_active?: boolean;
  status?: string;
  min_stock_threshold?: number;
  auto_reorder_enabled?: boolean;
}

interface RestockRequestItem {
  _id: string;
  id?: string;
  tobacco_id: string;
  tobacco_name?: string;
  quantity: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'items', label: 'Табаки', icon: <Package className="w-4 h-4" /> },
  { key: 'stock', label: 'Склад', icon: <Settings className="w-4 h-4" /> },
  { key: 'restock', label: 'Заявки на пополнение', icon: <ClipboardList className="w-4 h-4" /> },
];

const statusColors: Record<string, 'gold' | 'green' | 'red' | 'gray'> = {
  pending: 'gold',
  approved: 'gold',
  completed: 'green',
  rejected: 'red',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  completed: 'Выполнено',
  rejected: 'Отклонено',
};

export function TobaccoAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('items');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-white">Управление табаками</h1>
        <p className="text-sm text-white/40 mt-0.5">Учёт остатков и заявки на пополнение</p>
      </motion.div>

      <TabBar tabs={tabs} active={activeTab} onSelect={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'items' && <TobaccoItemsPanel />}
          {activeTab === 'stock' && <StockPanel />}
          {activeTab === 'restock' && <RestockPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabBar({ tabs, active, onSelect }: { tabs: { key: Tab; label: string; icon: React.ReactNode }[]; active: Tab; onSelect: (k: Tab) => void }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-glass-bg border border-glass-border p-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            active === t.key ? 'text-black' : 'text-white/50 hover:text-white/80'
          }`}
        >
          {active === t.key && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 bg-accent-gold/20 rounded-xl"
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {t.icon}
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function TobaccoItemsPanel() {
  const [items, setItems] = useState<TobaccoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TobaccoItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [flavor, setFlavor] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [weightGrams, setWeightGrams] = useState(50);
  const [minStockThreshold, setMinStockThreshold] = useState(5);
  const [autoReorder, setAutoReorder] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api('/api/tobacco');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast('Ошибка загрузки', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchItems();
    return () => ac.abort();
  }, [fetchItems]);

  const resetForm = () => {
    setName('');
    setBrand('');
    setFlavor('');
    setDescription('');
    setPrice('');
    setWeightGrams(50);
    setMinStockThreshold(5);
    setAutoReorder(false);
    setFile(null);
    setEditingItem(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (item: TobaccoItem) => {
    setEditingItem(item);
    setName(item.name);
    setBrand(item.brand || '');
    setFlavor(item.flavor || '');
    setDescription(item.description || '');
    setPrice(item.price?.toString() || '');
    setWeightGrams(item.weight_grams ?? 50);
    setMinStockThreshold(item.min_stock_threshold ?? 5);
    setAutoReorder(item.auto_reorder_enabled ?? false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      name, brand, flavor, description,
      price: price ? Number(price) : 0,
      weight_grams: weightGrams,
      min_stock_threshold: minStockThreshold,
      auto_reorder_enabled: autoReorder,
    };

    try {
      if (editingItem) {
        await api(`/api/tobacco/${editingItem._id}`, { method: 'PUT', body: payload });
        showToast('Товар обновлён', 'success');
      } else {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
        if (file) formData.append('image', file);
        formData.append('stock_quantity', '0');
        await api('/api/tobacco', { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Товар добавлен', 'success');
      }
      setModalOpen(false);
      resetForm();
      fetchItems();
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
      await api(`/api/tobacco/${deleteTarget}`, { method: 'DELETE' });
      showToast('Товар удалён', 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchItems();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/40">{items.length} позиций</p>
        <GlowButton onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Добавить
        </GlowButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-glass-bg border border-glass-border hover:border-accent-gold/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-surface flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                    {item.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-white/40 truncate">
                  {[item.brand, item.flavor].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {item.weight_grams ? (
                  <p className="text-[10px] text-white/30">{item.weight_grams} г</p>
                ) : null}
                <p className="text-sm text-white/60">
                  Остаток: <span className={item.stock_quantity < (item.min_stock_threshold ?? 5) ? 'text-red-400' : 'text-green-400'}>{item.stock_quantity}</span>
                </p>
                {item.min_stock_threshold != null && (
                  <p className="text-[10px] text-white/30">Мин. порог: {item.min_stock_threshold}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
                  onClick={() => openEdit(item)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={() => { setDeleteTarget(item._id); setDeleteDialogOpen(true); }}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-16 text-white/30 text-sm">Нет товаров</div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? 'Редактировать' : 'Добавить табак'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {!editingItem && <FileUploader onFileSelect={setFile} accept="image/*" />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Название</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input" required />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Бренд</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="glass-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Вкус</label>
            <input type="text" value={flavor} onChange={(e) => setFlavor(e.target.value)} className="glass-input" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-[60px] resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Цена</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="glass-input" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Граммовка</label>
              <input type="number" value={weightGrams} onChange={(e) => setWeightGrams(Number(e.target.value))} className="glass-input" min="0" step="1" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Мин. порог остатка</label>
              <input type="number" value={minStockThreshold} onChange={(e) => setMinStockThreshold(Number(e.target.value))} className="glass-input" min="0" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50 font-medium">Автозаказ:</label>
            <button
              type="button"
              onClick={() => setAutoReorder(!autoReorder)}
              className={`relative w-11 h-6 rounded-full transition-colors ${autoReorder ? 'bg-accent-gold/30' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${autoReorder ? 'left-[22px] bg-accent-gold' : 'left-0.5 bg-white/30'}`} />
            </button>
            <span className="text-xs text-white/40">{autoReorder ? 'Включено' : 'Выключено'}</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <GlowButton variant="secondary" type="button" onClick={() => { setModalOpen(false); resetForm(); }}>Отмена</GlowButton>
            <GlowButton type="submit" loading={saving}>{editingItem ? 'Сохранить' : 'Добавить'}</GlowButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Удалить товар"
        message="Вы уверены, что хотите удалить этот товар?"
        confirmText="Удалить"
        loading={deleting}
      />
    </div>
  );
}

function StockPanel() {
  const [items, setItems] = useState<TobaccoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      const data = await api('/api/tobacco/stock');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast('Ошибка загрузки остатков', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchStock();
    return () => ac.abort();
  }, [fetchStock]);

  const getEditValue = (id: string) => editValues[id] ?? items.find((i) => i._id === id)?.stock_quantity ?? 0;

  const adjustStock = (id: string, delta: number) => {
    const current = getEditValue(id);
    const next = Math.max(0, current + delta);
    setEditValues((prev) => ({ ...prev, [id]: next }));
  };

  const setManual = (id: string, val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setEditValues((prev) => ({ ...prev, [id]: num }));
    }
  };

  const saveStock = async (item: TobaccoItem) => {
    const quantity = getEditValue(item._id);
    setSavingId(item._id);
    const prev = item.stock_quantity;
    item.stock_quantity = quantity;
    try {
      await api(`/api/tobacco/${item._id}/stock`, { method: 'PUT', body: { quantity } });
      showToast(`${item.name}: остаток обновлён`, 'success');
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[item._id];
        return next;
      });
    } catch {
      item.stock_quantity = prev;
      showToast('Ошибка обновления', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/40">Управление остатками на складе</p>
        <GlowButton variant="secondary" size="sm" onClick={fetchStock}>
          <RefreshCw className="w-4 h-4" /> Обновить
        </GlowButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-glass-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border bg-glass-bg">
                {['Название', 'Бренд', 'Граммовка', 'Текущий остаток', 'Мин. порог', 'Автозаказ', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = item.stock_quantity < (item.min_stock_threshold ?? 5);
                const editVal = getEditValue(item._id);
                const isDirty = editVal !== item.stock_quantity;

                return (
                  <tr
                    key={item._id}
                    className={`border-b border-glass-border/50 transition-colors ${
                      isLow ? 'bg-accent-gold/5' : 'hover:bg-accent-gold/3'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-white/80 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-white/50">{item.brand || '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{item.weight_grams ? `${item.weight_grams} г` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-accent-gold transition-colors"
                          onClick={() => adjustStock(item._id, -1)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.button>
                        <input
                          type="number"
                          value={editVal}
                          onChange={(e) => setManual(item._id, e.target.value)}
                          className={`w-20 text-center text-sm font-mono rounded-lg border px-2 py-1 bg-dark-surface ${
                            isLow
                              ? 'text-red-400 border-red-500/30'
                              : 'text-green-400 border-green-500/30'
                          }`}
                          min={0}
                        />
                        <motion.button
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-accent-gold transition-colors"
                          onClick={() => adjustStock(item._id, 1)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </motion.button>
                        {isLow && <span className="text-[10px] text-red-400 font-medium">Мало</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">{item.min_stock_threshold ?? 5}</td>
                    <td className="px-4 py-3">
                      {item.auto_reorder_enabled ? (
                        <Badge text="Да" color="green" size="sm" />
                      ) : (
                        <Badge text="Нет" color="gray" size="sm" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <GlowButton
                        size="sm"
                        variant="primary"
                        onClick={() => saveStock(item)}
                        loading={savingId === item._id}
                        disabled={!isDirty}
                      >
                        Сохранить
                      </GlowButton>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-white/40">Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type RestockFilter = 'all' | 'pending' | 'approved' | 'completed' | 'rejected';

function RestockPanel() {
  const [requests, setRequests] = useState<RestockRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RestockFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tobaccoItems, setTobaccoItems] = useState<TobaccoItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTobaccoId, setNewTobaccoId] = useState('');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newNotes, setNewNotes] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const data = await api('/api/restock/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      showToast('Ошибка загрузки заявок', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTobacco = useCallback(async () => {
    try {
      const data = await api('/api/tobacco');
      setTobaccoItems(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchRequests(); fetchTobacco();
    return () => ac.abort();
  }, [fetchRequests, fetchTobacco]);

  const updateStatus = async (id: string, status: RestockRequestItem['status']) => {
    setActionLoading(id);
    try {
      await api(`/api/restock/requests/${id}`, { method: 'PUT', body: { status } });
      const labels: Record<string, string> = { pending: 'в ожидание', approved: 'одобрена', completed: 'выполнена', rejected: 'отклонена' };
      showToast(`Заявка ${labels[status]}`, 'success');
      fetchRequests();
    } catch {
      showToast('Ошибка обновления', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTobaccoId) { showToast('Выберите табак', 'error'); return; }
    if (newQuantity < 1) { showToast('Количество должно быть больше 0', 'error'); return; }

    try {
      await api('/api/restock/requests', { method: 'POST', body: {
        tobacco_id: newTobaccoId,
        quantity: newQuantity,
        notes: newNotes,
      } });
      showToast('Заявка создана', 'success');
      setCreateModalOpen(false);
      setNewTobaccoId('');
      setNewQuantity(100);
      setNewNotes('');
      fetchRequests();
    } catch {
      showToast('Ошибка создания заявки', 'error');
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const filterOptions: { key: RestockFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'pending', label: 'Ожидают' },
    { key: 'approved', label: 'Одобрены' },
    { key: 'completed', label: 'Выполнены' },
    { key: 'rejected', label: 'Отклонены' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === opt.key
                  ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
                  : 'text-white/40 hover:text-white/70 border border-transparent'
              }`}
            >
              {opt.label}
              {counts[opt.key] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                  filter === opt.key ? 'bg-accent-gold/20' : 'bg-white/10'
                }`}>
                  {counts[opt.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <GlowButton size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" /> Новая заявка
        </GlowButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const isPending = req.status === 'pending';

            return (
              <div
                key={req._id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? 'bg-accent-gold/5 border-accent-gold/30'
                    : 'bg-glass-bg border-glass-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{req.tobacco_name || 'Неизвестный табак'}</p>
                      <Badge text={statusLabels[req.status]} color={statusColors[req.status]} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/50">
                        <span className="text-accent-gold font-medium">{req.quantity}</span> г
                      </span>
                      <span className="text-[10px] text-white/30">
                        {new Date(req.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {req.notes && <span className="text-xs text-white/30 italic">{req.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isPending && (
                      <>
                        <GlowButton
                          size="sm" variant="gold"
                          onClick={() => updateStatus(req._id, 'approved')}
                          loading={actionLoading === req._id}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Одобрить
                        </GlowButton>
                        <GlowButton
                          size="sm" variant="danger"
                          onClick={() => updateStatus(req._id, 'rejected')}
                          loading={actionLoading === req._id}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Отклонить
                        </GlowButton>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <GlowButton
                        size="sm" variant="primary"
                        onClick={() => updateStatus(req._id, 'completed')}
                        loading={actionLoading === req._id}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Выполнено
                      </GlowButton>
                    )}
                    {req.status === 'completed' && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Готово
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> Отклонено
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-white/30">
              <ClipboardList className="w-8 h-8" />
              <p className="text-sm">Нет заявок</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Новая заявка на пополнение" size="md">
        <form onSubmit={createRequest} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Табак</label>
            <select
              value={newTobaccoId}
              onChange={(e) => setNewTobaccoId(e.target.value)}
              className="glass-input w-full"
              required
            >
              <option value="">Выберите табак...</option>
              {tobaccoItems.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}{t.brand ? ` (${t.brand})` : ''} — остаток: {t.stock_quantity}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Количество (грамм)</label>
            <input type="number" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} className="glass-input" min={1} required />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Комментарий</label>
            <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="glass-input min-h-[60px] resize-none" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <GlowButton variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>Отмена</GlowButton>
            <GlowButton type="submit">Создать заявку</GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
