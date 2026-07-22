import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Shield, Ban, CheckCircle, Eye, X, Trash2, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  personalPrice: number | null;
  isBlocked: boolean;
  adminNote: string | null;
  createdAt: string;
}

interface UserDetail {
  user: UserData;
  orders: { items: any[]; total: number };
}

const PRICE_OPTIONS = [null, 500, 750, 1000];
type Tab = 'all' | 'blocked' | 'admins';

export function UsersAdmin() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      const params: any = {};
      if (search) params.search = search;
      const data = await api<UserData[]>('/api/users', { params, signal });
      setUsers(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Ошибка загрузки клиентов', 'error');
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const ac = new AbortController();
    fetchUsers(ac.signal);
    return () => ac.abort();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    switch (activeTab) {
      case 'blocked': return users.filter(u => u.isBlocked);
      case 'admins': return users.filter(u => u.role === 'admin');
      default: return users;
    }
  }, [users, activeTab]);

  const counts = useMemo(() => ({
    all: users.length,
    blocked: users.filter(u => u.isBlocked).length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  const openDetail = async (userId: string) => {
    try {
      const data = await api<UserDetail>(`/api/users/${userId}`);
      setSelectedUser(data);
      setEditingPrice(data.user.personalPrice);
    } catch {
      showToast('Ошибка загрузки профиля', 'error');
    }
  };

  const closeDetail = () => {
    setSelectedUser(null);
    setEditingPrice(null);
  };

  const updatePrice = async (userId: string, price: number | null) => {
    setSaving(true);
    try {
      await api(`/api/users/${userId}`, {
        method: 'PATCH',
        body: { personal_price: price },
      });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, personalPrice: price } : u
      ));
      if (selectedUser?.user.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, user: { ...prev.user, personalPrice: price } } : null);
      }
      showToast(price !== null ? `Цена установлена: ${price} ₽` : 'Цена сброшена', 'success');
    } catch {
      showToast('Не удалось обновить цену', 'error');
    }
    setSaving(false);
  };

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      await api(`/api/users/${userId}`, {
        method: 'PATCH',
        body: { is_blocked: !currentBlocked },
      });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isBlocked: !currentBlocked } : u
      ));
      if (selectedUser?.user.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, user: { ...prev.user, isBlocked: !currentBlocked } } : null);
      }
      showToast(!currentBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован', 'success');
    } catch {
      showToast('Не удалось изменить статус блокировки', 'error');
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await api(`/api/users/${userId}`, {
        method: 'PATCH',
        body: { role: newRole },
      });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      if (selectedUser?.user.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, user: { ...prev.user, role: newRole } } : null);
      }
      showToast(newRole === 'admin' ? 'Назначен администратором' : 'Роль изменена на Клиент', 'success');
    } catch {
      showToast('Не удалось изменить роль', 'error');
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast('Пользователь удалён', 'success');
      setDeleteTarget(null);
      if (selectedUser?.user.id === deleteTarget.id) closeDetail();
    } catch (err: any) {
      showToast(err?.message || 'Не удалось удалить', 'error');
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
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const result = await api<{ deleted: number; skipped: number }>('/api/users/bulk-delete', { method: 'POST', body: { ids: Array.from(selectedIds) } });
      showToast(`Удалено ${result.deleted}${result.skipped ? `, пропущено ${result.skipped} (админы)` : ''}`, 'success');
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Ошибка массового удаления', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkBlock = async (block: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await api('/api/users/bulk-block', { method: 'POST', body: { ids: Array.from(selectedIds), is_blocked: block } });
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, isBlocked: block } : u));
      showToast(block ? `${selectedIds.size} пользователей заблокировано` : `${selectedIds.size} пользователей разблокировано`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Ошибка', 'error');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0D0F13] flex items-center justify-center border border-glass-border">
            <Users className="w-4 h-4 text-[#FFBF00]" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-white">Клиенты</h1>
            <p className="text-[10px] text-white/40">Управление пользователями и ролями</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email или телефону..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D0F13] border border-glass-border text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FFBF00]/50 transition-colors"
          />
        </div>
      </GlassCard>

      {/* Tabs */}
      <TabSwitcher<Tab>
        tabs={[
          { id: 'all', label: 'Все', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'blocked', label: 'Заблокированные', icon: <Ban className="w-3.5 h-3.5" /> },
          { id: 'admins', label: 'Администраторы', icon: <Shield className="w-3.5 h-3.5" /> },
        ]}
        active={activeTab}
        onSelect={setActiveTab}
        variant="glass"
      />

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/30 flex-wrap"
        >
          <span className="text-xs text-accent-gold font-medium">{selectedIds.size} выбрано</span>
          <button onClick={toggleSelectAll} className="text-xs text-white/50 hover:text-white/70 transition-colors">
            {selectedIds.size === filteredUsers.length ? 'Снять все' : 'Выбрать все'}
          </button>
          <div className="flex-1" />
          <GlowButton size="sm" variant="secondary" onClick={() => handleBulkBlock(false)}>
            <CheckCircle className="w-3.5 h-3.5" /> Разблокировать
          </GlowButton>
          <GlowButton size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-3.5 h-3.5" /> Удалить ({selectedIds.size})
          </GlowButton>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/40 hover:text-white/60 transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Users List */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              {activeTab === 'blocked' ? 'Нет заблокированных' : activeTab === 'admins' ? 'Нет администраторов' : 'Клиенты не найдены'}
            </p>
          </GlassCard>
        ) : (
          filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <GlassCard className={`p-3 transition-all ${selectedIds.has(user.id) ? 'border-accent-gold/60 bg-accent-gold/5' : ''}`}>
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <label className="flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-md border-2 border-white/20 peer-checked:border-accent-gold peer-checked:bg-accent-gold/20 flex items-center justify-center transition-all">
                      {selectedIds.has(user.id) && (
                        <svg className="w-3 h-3 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#0D0F13] border border-glass-border flex items-center justify-center text-xs font-bold text-[#FFBF00] flex-shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-white truncate">{user.name || 'Без имени'}</span>
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center rounded-full font-medium border whitespace-nowrap px-1.5 py-0 text-[10px] bg-[#FFBF00]/10 text-[#FFBF00] border-[#FFBF00]/20">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> ADMIN
                        </span>
                      )}
                      {user.isBlocked && (
                        <span className="inline-flex items-center rounded-full font-medium border whitespace-nowrap px-1.5 py-0 text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                          <Ban className="w-2.5 h-2.5 mr-0.5" /> ЗАБЛОКИРОВАН
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                  </div>

                  {/* Role selector */}
                  <div className="hidden sm:block">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="bg-[#0D0F13] border border-glass-border rounded-lg text-[10px] font-medium text-white px-2 py-1 cursor-pointer focus:outline-none focus:border-[#FFBF00]/50 appearance-none"
                    >
                      <option value="user">Клиент</option>
                      <option value="admin">Админ</option>
                    </select>
                  </div>

                  {/* Price (inline) */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-white/30">Цена:</span>
                    <select
                      value={user.personalPrice ?? ''}
                      onChange={async (e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        try {
                          await api(`/api/users/${user.id}`, { method: 'PATCH', body: { personal_price: val } });
                          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, personalPrice: val } : u));
                          showToast(val !== null ? `Цена: ${val} ₽` : 'Цена сброшена', 'success');
                        } catch { showToast('Ошибка', 'error'); }
                      }}
                      className="bg-[#0D0F13] border border-glass-border rounded-lg text-sm font-mono text-[#FFBF00] px-2 py-1 cursor-pointer focus:outline-none focus:border-[#FFBF00]/50"
                    >
                      <option value="">—</option>
                      <option value="500">500 ₽</option>
                      <option value="750">750 ₽</option>
                      <option value="1000">1000 ₽</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={() => openDetail(user.id)}
                      className="p-2 rounded-lg text-white/40 hover:text-[#FFBF00] hover:bg-[#FFBF00]/10 transition-colors"
                      whileTap={{ scale: 0.9 }}
                      title="Подробнее"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => toggleBlock(user.id, user.isBlocked)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isBlocked
                          ? 'text-green-400 hover:bg-green-500/10'
                          : 'text-red-400 hover:bg-red-500/10'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      title={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    >
                      {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </motion.button>
                    {user.role !== 'admin' && (
                      <motion.button
                        onClick={() => setDeleteTarget(user)}
                        className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        whileTap={{ scale: 0.9 }}
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetail}
          >
            <motion.div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1a1815] border border-[#FFBF00]/10 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#FFBF00]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0D0F13] border border-[#FFBF00]/20 flex items-center justify-center text-xs font-bold text-[#FFBF00] overflow-hidden">
                    {selectedUser.user.avatar ? (
                      <img src={selectedUser.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.user.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-white">{selectedUser.user.name || 'Без имени'}</h2>
                    <p className="text-xs text-white/40">{selectedUser.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                {/* Personal Price */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Персональная цена</label>
                  <div className="flex gap-2">
                    {PRICE_OPTIONS.map((price) => (
                      <button
                        key={String(price)}
                        onClick={() => !saving && updatePrice(selectedUser.user.id, price)}
                        disabled={saving}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          editingPrice === price
                            ? 'bg-[#FFBF00]/10 border-[#FFBF00]/40 text-[#FFBF00]'
                            : 'bg-[#0D0F13] border-glass-border text-white/50 hover:border-white/20 hover:text-white/70'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {price !== null ? `${price} ₽` : 'Сброс'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Роль</label>
                  <div className="flex gap-2">
                    {['user', 'admin'].map((r) => (
                      <button
                        key={r}
                        onClick={() => changeRole(selectedUser.user.id, r)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                          selectedUser.user.role === r
                            ? r === 'admin'
                              ? 'bg-[#FFBF00]/10 border-[#FFBF00]/40 text-[#FFBF00]'
                              : 'bg-green-500/10 border-green-500/40 text-green-400'
                            : 'bg-[#0D0F13] border-glass-border text-white/50 hover:border-white/20 hover:text-white/70'
                        }`}
                      >
                        {r === 'admin' ? 'Администратор' : 'Клиент'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/40">Телефон</span>
                    <span className="text-sm text-white">{selectedUser.user.phone || 'Не указан'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/40">Роль</span>
                    <Badge text={selectedUser.user.role === 'admin' ? 'Администратор' : 'Клиент'} color={selectedUser.user.role === 'admin' ? 'gold' : 'gray'} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/40">Статус</span>
                    <Badge text={selectedUser.user.isBlocked ? 'Заблокирован' : 'Активен'} color={selectedUser.user.isBlocked ? 'red' : 'green'} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/40">Регистрация</span>
                    <span className="text-sm text-white">{formatDate(selectedUser.user.createdAt)}</span>
                  </div>
                </div>

                {/* Order History */}
                {selectedUser.orders.items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                      История заказов ({selectedUser.orders.total})
                    </h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedUser.orders.items.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0D0F13] border border-white/5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'done' ? 'bg-green-500' :
                              order.status === 'cancelled' ? 'bg-red-500' :
                              'bg-[#FFBF00]'
                            }`} />
                            <span className="text-white/60">{order.seat_label || 'Без стола'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/40">{formatDate(order.created_at)}</span>
                            {order.price && <span className="text-[#FFBF00] font-mono">{order.price} ₽</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#FFBF00]/10 flex gap-2">
                <button
                  onClick={() => toggleBlock(selectedUser.user.id, selectedUser.user.isBlocked)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                    selectedUser.user.isBlocked
                      ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {selectedUser.user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
                {selectedUser.user.role !== 'admin' && (
                  <button
                    onClick={() => { setDeleteTarget(selectedUser.user); closeDetail(); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeDetail}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
        title="Удалить пользователя?"
        message={`Вы уверены, что хотите удалить ${deleteTarget?.name || deleteTarget?.email}? Это действие необратимо.`}
        confirmText="Удалить"
        variant="danger"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Удалить ${selectedIds.size} пользователей?`}
        message={`Вы уверены, что хотите удалить ${selectedIds.size} пользователей? Администраторы будут пропущены. Это действие необратимо.`}
        confirmText={`Удалить ${selectedIds.size}`}
        variant="danger"
        loading={bulkDeleting}
      />
    </div>
  );
}
