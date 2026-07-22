import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Package, ClipboardList, Settings,
  ChevronUp, ChevronDown, CheckCircle2, XCircle,
  Filter, RefreshCw, Search,
} from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { FileUploader } from '@/components/FileUploader';
import { showToast } from '@/components/NotificationToast';
import { getFlavorsForBrand, getBrandNames } from '@/data/tobaccoBrands';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import api from '@/lib/api';

const FLAVOR_EMOJI_MAP: Record<string, string> = {
  'яблоко': '🍏', 'двойное яблоко': '🍏', 'apple': '🍏',
  'манго': '🥭', 'манго-маракуйя': '🥭', 'mango': '🥭',
  'персик': '🍑', 'персик-лайм': '🍑', 'peach': '🍑',
  'грейпфрут': '🍊', 'грейпфрут-мята': '🍊', 'citrus': '🍊', 'цитрус': '🍊',
  'клубника': '🍓', 'клубника-мята': '🍓', 'strawberry': '🍓', 'земляника': '🍓',
  'черника': '🫐', 'черника-ежевика': '🫐', 'blueberry': '🫐', 'ежевика': '🫐',
  'малина': '🫐', 'малина-личи': '🫐', 'raspberry': '🫐',
  'арбуз': '🍉', 'арбуз-дыня': '🍉', 'watermelon': '🍉',
  'банан': '🍌', 'банан-шоколад': '🍌', 'banana': '🍌',
  'кокос': '🥥', 'кокос-ваниль': '🥥', 'coconut': '🥥',
  'лимон': '🍋', 'лимон-имбирь': '🍋', 'lemon': '🍋', 'лайм': '🍋',
  'мята': '🧊', 'мята-айс': '🧊', 'mint': '🧊', 'айс': '🧊', 'фрост': '🧊',
  'кактус': '🌵', 'кактус-фрост': '🌵', 'cactus': '🌵',
  'виноград': '🍇', 'виноград-ягоды': '🍇', 'grape': '🍇',
  'вишня': '🍒', 'cherry': '🍒',
  'гранат': '🍎', 'pomegranate': '🍎',
  'ананас': '🍍', 'pineapple': '🍍',
  'гаува': '🍈', 'guava': '🍈',
  'дыня': '🍈', 'melon': '🍈',
  'кофе': '☕', 'coffee': '☕', 'капучино': '☕',
  'шоколад': '🍫', 'chocolate': '🍫', 'какао': '🍫',
  'карамель': '🍯', 'caramel': '🍯',
  'ванилия': '🍦', 'ваниль': '🍦', 'vanilla': '🍦',
  'сливки': '🥛', 'cream': '🥛',
  'кола': '🥤', 'cola': '🥤',
  'табак': '🍃', 'tobacco': '🍃', 'трава': '🌿',
  'спайс': '🌶️', 'спирт': '🍷', 'вино': '🍷', 'wine': '🍷',
  'маракуйя': '🟣', 'passion fruit': '🟣',
};

const PRELOADED_EMOJIS = [
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
  '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🌵',
  '🧊', '🍵', '☕', '🧃', '🥤', '🍷', '🍸', '🍹', '🥛', '🍾',
  '🌶️', '🍫', '🍬', '🍭', '🍯', '🍦', '🍮', '🍁', '🌿', '🍃',
  '🔥', '💎', '⭐', '🏆', '💪', '🎵', '🎮', '🎲', '🎯', '🎪',
];

function guessEmoji(flavorName: string): string {
  const lower = flavorName.toLowerCase().trim();
  for (const [keyword, emoji] of Object.entries(FLAVOR_EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji;
  }
  return '🍂';
}

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

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'items', label: 'Табаки', icon: <Package className="w-4 h-4" /> },
  { id: 'stock', label: 'Склад', icon: <Settings className="w-4 h-4" /> },
  { id: 'restock', label: 'Заявки на пополнение', icon: <ClipboardList className="w-4 h-4" /> },
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
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-lg font-display font-bold text-white">Управление табаками</h1>
        <p className="text-xs text-white/40 mt-0">Учёт остатков и заявки на пополнение</p>
      </motion.div>

      <TabSwitcher<Tab>
        tabs={tabs}
        active={activeTab}
        onSelect={setActiveTab}
        variant="minimal"
      />

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

function TobaccoItemsPanel() {
  const [items, setItems] = useState<TobaccoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TobaccoItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [flavor, setFlavor] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [weightGrams, setWeightGrams] = useState(50);
  const [minStockThreshold, setMinStockThreshold] = useState(5);
  const [autoReorder, setAutoReorder] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const brandNames = getBrandNames();
  const availableFlavors = brand ? getFlavorsForBrand(brand) : [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.flavor && item.flavor.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api('/api/tobacco');
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      // Detect if migration is needed: items exist but lack inventory fields
      setMigrationNeeded(list.length > 0 && list[0]?.stock_quantity === undefined && !('min_stock_threshold' in (list[0] || {})));
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
    setEmoji('');
    setDescription('');
    setPrice('');
    setWeightGrams(50);
    setMinStockThreshold(5);
    setAutoReorder(false);
    setFile(null);
    setEditingItem(null);
    setValidationErrors([]);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (item: TobaccoItem) => {
    setEditingItem(item);
    setName(item.name);
    setBrand(item.brand || '');
    setFlavor(item.flavor || '');
    setEmoji((item as any).emoji || '');
    setDescription(item.description || '');
    setPrice(item.price?.toString() || '');
    setWeightGrams(item.weight_grams ?? 50);
    setMinStockThreshold(item.min_stock_threshold ?? 5);
    setAutoReorder(item.auto_reorder_enabled ?? false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate name if empty
    if (!name?.trim() && brand && flavor) {
      setName(`${brand} - ${flavor}`);
    }

    setSaving(true);
    const finalName = name || `${brand} - ${flavor}` || 'Без названия';
    const payload: Record<string, unknown> = {
      name: finalName,
      brand: brand || '',
      flavor: flavor || '',
      emoji: emoji || guessEmoji(flavor),
      description,
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await api('/api/tobacco/bulk-delete', { method: 'POST', body: { ids: Array.from(selectedIds) } });
      showToast(`Удалено ${selectedIds.size} позиций`, 'success');
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
    <div className="space-y-2">
      {migrationNeeded && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
          ⚠️ База данных нуждается в миграции. Некоторые колонки (остатки, вес, пороги) отсутствуют.
          Управление остатками пока ограничено. Обратитесь к администратору для запуска миграции.
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className="glass-input pl-8 py-1.5 text-xs w-full"
          />
        </div>
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-accent-gold font-medium">{selectedIds.size} выбрано</span>
            <GlowButton size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" /> Удалить ({selectedIds.size})
            </GlowButton>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/40 hover:text-white/60 transition-colors">Снять</button>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/40 flex-shrink-0">
              {filteredItems.length}{searchQuery ? ` из ${items.length}` : ''} позиций
            </p>
            <GlowButton onClick={openCreate} size="sm">
              <Plus className="w-4 h-4" /> Добавить
            </GlowButton>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border-2 border-white/20 peer-checked:border-accent-gold peer-checked:bg-accent-gold/20 flex items-center justify-center transition-all">
                  {selectedIds.size === filteredItems.length && filteredItems.length > 0 && (
                    <svg className="w-2.5 h-2.5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {selectedIds.size > 0 && selectedIds.size < filteredItems.length && (
                    <div className="w-2 h-0.5 bg-accent-gold rounded" />
                  )}
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                  {selectedIds.size > 0 ? `${selectedIds.size}/${filteredItems.length}` : 'Выбрать все'}
                </span>
              </label>
            </div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`flex items-center gap-3 p-3 rounded-xl bg-glass-bg border transition-all ${
                selectedIds.has(item._id)
                  ? 'border-accent-gold/60 bg-accent-gold/5'
                  : 'border-glass-border hover:border-accent-gold/30'
              }`}
            >
              <label className="flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item._id)}
                  onChange={() => toggleSelect(item._id)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border-2 border-white/20 peer-checked:border-accent-gold peer-checked:bg-accent-gold/20 flex items-center justify-center transition-all">
                  {selectedIds.has(item._id) && (
                    <svg className="w-3 h-3 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-surface flex-shrink-0">
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
                <button
                  className="p-2.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  onClick={() => openEdit(item)}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="p-2.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  onClick={() => { setDeleteTarget(item._id); setDeleteDialogOpen(true); }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-16 text-white/30 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Нет товаров'}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? 'Редактировать' : 'Добавить табак'} size="lg">
        <form onSubmit={handleSave} className="space-y-2">
          {validationErrors.length > 0 && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {validationErrors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}
          {!editingItem && <FileUploader onFileSelect={setFile} accept="image/*" />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Бренд *</label>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setFlavor('');
                  if (e.target.value && flavor) {
                    setName(`${e.target.value} - ${flavor}`);
                  } else {
                    setName('');
                  }
                }}
                className="glass-input w-full"
                required
              >
                <option value="">Выберите бренд...</option>
                {brandNames.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {brand && (
                <p className="text-[10px] text-accent-gold/60 mt-1">
                  {getFlavorsForBrand(brand).length} вкусов
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Вкус *</label>
              <select
                value={flavor}
                onChange={(e) => {
                  setFlavor(e.target.value);
                  if (brand && e.target.value) {
                    setName(`${brand} - ${e.target.value}`);
                  }
                  if (e.target.value && !emoji) {
                    setEmoji(guessEmoji(e.target.value));
                  }
                }}
                className="glass-input w-full"
                required
                disabled={!brand}
              >
                <option value="">{brand ? 'Выберите вкус...' : 'Сначала выберите бренд'}</option>
                {availableFlavors.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Эмодзи</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🍏"
                  className="glass-input w-16 text-center text-lg"
                  maxLength={4}
                />
                <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto flex-1">
                  {PRELOADED_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-all ${
                        emoji === em
                          ? 'bg-accent-gold/20 ring-1 ring-accent-gold/50'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-white/50 mb-1 font-medium">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={brand && flavor ? `${brand} - ${flavor}` : 'Заполнится автоматически'}
              className="glass-input"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/50 mb-1 font-medium">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-[50px] resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Цена</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="glass-input" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Граммовка</label>
              <input type="number" value={weightGrams} onChange={(e) => setWeightGrams(Number(e.target.value))} className="glass-input" min="0" step="1" />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-1 font-medium">Мин. порог остатка</label>
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
          <div className="flex justify-end gap-2 pt-1">
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

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Удалить ${selectedIds.size} позиций?`}
        message={`Вы уверены, что хотите удалить ${selectedIds.size} позиций? Это действие необратимо.`}
        confirmText={`Удалить ${selectedIds.size}`}
        loading={bulkDeleting}
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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/40">Управление остатками на складе</p>
        <GlowButton variant="secondary" size="sm" onClick={fetchStock}>
          <RefreshCw className="w-4 h-4" /> Обновить
        </GlowButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-glass-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border bg-glass-bg">
                {['Название', 'Бренд', 'Граммовка', 'Текущий остаток', 'Мин. порог', 'Автозаказ', 'Действия'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-white/60 uppercase tracking-wider">{h}</th>
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
                    <td className="px-3 py-2 text-sm text-white/80 font-medium">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-white/50">{item.brand || '—'}</td>
                    <td className="px-3 py-2 text-sm text-white/60">{item.weight_grams ? `${item.weight_grams} г` : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-accent-gold transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                          onClick={() => adjustStock(item._id, -1)}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
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
                        <button
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-accent-gold transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                          onClick={() => adjustStock(item._id, 1)}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        {isLow && <span className="text-[10px] text-red-400 font-medium">Мало</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-white/60">{item.min_stock_threshold ?? 5}</td>
                    <td className="px-3 py-2">
                      {item.auto_reorder_enabled ? (
                        <Badge text="Да" color="green" size="sm" />
                      ) : (
                        <Badge text="Нет" color="gray" size="sm" />
                      )}
                    </td>
                    <td className="px-3 py-2">
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
                <tr><td colSpan={7} className="px-3 py-8 text-center text-white/40">Нет данных</td></tr>
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
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
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
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
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
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((req) => {
            const isPending = req.status === 'pending';

            return (
              <div
                key={req._id}
                className={`p-3 rounded-xl border transition-all ${
                  isPending
                    ? 'bg-accent-gold/5 border-accent-gold/30'
                    : 'bg-glass-bg border-glass-border'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-white truncate">{req.tobacco_name || 'Неизвестный табак'}</p>
                      <Badge text={statusLabels[req.status]} color={statusColors[req.status]} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
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
            <div className="flex flex-col items-center gap-1.5 py-10 text-white/30">
              <ClipboardList className="w-6 h-6" />
              <p className="text-sm">Нет заявок</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Новая заявка на пополнение" size="md">
        <form onSubmit={createRequest} className="space-y-2">
          <div>
            <label className="block text-[10px] text-white/50 mb-1 font-medium">Табак</label>
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
          <div className="flex justify-end gap-2 pt-1">
            <GlowButton variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>Отмена</GlowButton>
            <GlowButton type="submit">Создать заявку</GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
