import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Shield, Ban, CheckCircle, Eye, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
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

export function UsersAdmin() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const data = await api<UserData[]>('/api/users', { params, signal });
      setUsers(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('Ошибка загрузки клиентов', 'error');
    }
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => {
    const ac = new AbortController();
    fetchUsers(ac.signal);
    return () => ac.abort();
  }, [fetchUsers]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const formatPrice = (p: number | null) => p !== null ? `${p} ₽` : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D0F13] flex items-center justify-center border border-glass-border">
            <Users className="w-5 h-5 text-[#FFBF00]" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">Клиенты</h1>
            <p className="text-xs text-white/40">Управление пользователями и персональными ценами</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск по имени, email или телефону..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F13] border border-glass-border text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FFBF00]/50 transition-colors"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0D0F13] border border-glass-border text-white text-sm focus:outline-none focus:border-[#FFBF00]/50 appearance-none cursor-pointer"
          >
            <option value="">Все роли</option>
            <option value="user">Клиенты</option>
            <option value="admin">Администраторы</option>
          </select>
        </div>
      </GlassCard>

      {/* Users List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Клиенты не найдены</p>
          </GlassCard>
        ) : (
          users.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#0D0F13] border border-glass-border flex items-center justify-center text-sm font-bold text-[#FFBF00] flex-shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{user.name || 'Без имени'}</span>
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
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>

                  {/* Price (inline editable) */}
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
                  <div className="flex items-center gap-1.5">
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
              <div className="flex items-center justify-between p-5 border-b border-[#FFBF00]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0D0F13] border border-[#FFBF00]/20 flex items-center justify-center text-sm font-bold text-[#FFBF00] overflow-hidden">
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
              <div className="p-5 space-y-5">
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
              <div className="p-5 border-t border-[#FFBF00]/10 flex gap-3">
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
    </div>
  );
}
