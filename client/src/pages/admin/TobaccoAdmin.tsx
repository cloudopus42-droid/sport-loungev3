import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, AlertTriangle, History } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';

type TobaccoMix = {
  id: string;
  name: string;
  brand: string;
  stock_quantity: number;
  unit: string;
  is_active: boolean;
};

type Transaction = {
  id: string;
  type: string;
  quantity: number;
  unit: string;
  price: number;
  notes: string;
  created_at: string;
  mixes: { name: string };
};

export function TobaccoAdmin() {
  const [mixes, setMixes] = useState<TobaccoMix[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stock' | 'history' | 'low'>('stock');
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseData, setPurchaseData] = useState({ mix_id: '', quantity: 100, price: 0, notes: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mixesRes, txRes] = await Promise.all([
        api.get<TobaccoMix[]>('/api/tobacco'),
        api.get<Transaction[]>('/api/tobacco/transactions'),
      ]);
      setMixes(mixesRes.data || []);
      setTransactions(txRes.data || []);
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePurchase = async () => {
    try {
      await api.post('/api/tobacco/purchase', purchaseData);
      showToast('Закупка добавлена', 'success');
      setShowPurchase(false);
      setPurchaseData({ mix_id: '', quantity: 100, price: 0, notes: '' });
      loadData();
    } catch {
      showToast('Ошибка при добавлении закупки', 'error');
    }
  };

  const handleWriteOff = async (mixId: string, quantity: number) => {
    try {
      await api.post('/api/tobacco/write-off', { mix_id: mixId, quantity, notes: 'Списание (админ)' });
      showToast('Списание выполнено', 'success');
      loadData();
    } catch {
      showToast('Ошибка списания', 'error');
    }
  };

  const lowStock = mixes.filter(m => m.stock_quantity < 100 && m.is_active);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Учёт табака</h1>
          <p className="text-sm text-white/50">Остатки, закупки, списания</p>
        </div>
        <button
          onClick={() => setShowPurchase(true)}
          className="px-4 py-2 rounded-xl bg-accent-gold text-black text-xs font-bold flex items-center gap-1.5 hover:bg-accent-gold/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Закупка
        </button>
      </div>

      <div className="flex gap-1.5 border-b border-glass-border/10 pb-3">
        {(['stock', 'history', 'low'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30' : 'text-white/50 hover:text-white'
            }`}
          >
            {t === 'stock' ? 'Остатки' : t === 'history' ? 'История' : `Малый запас (${lowStock.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : tab === 'stock' ? (
        <div className="space-y-2">
          {mixes.map(m => (
            <GlassCard key={m.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-accent-gold/60" />
                <div>
                  <p className="text-sm font-semibold text-white">{m.name}</p>
                  <p className="text-[10px] text-white/40">{m.brand}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold font-mono ${m.stock_quantity < 100 ? 'text-red-400' : 'text-white'}`}>
                  {m.stock_quantity} {m.unit}
                </span>
                {m.stock_quantity >= 100 && (
                  <button
                    onClick={() => {
                      const q = prompt('Сколько списать (грамм)?', '50');
                      if (q) handleWriteOff(m.id, parseInt(q));
                    }}
                    className="px-2 py-1 rounded-lg border border-white/10 text-[10px] text-white/50 hover:border-red-400/30 hover:text-red-400 transition-all"
                  >
                    Списать
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : tab === 'history' ? (
        <div className="space-y-2">
          {transactions.map(tx => (
            <GlassCard key={tx.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {tx.type === 'purchase' ? 'Закупка' : tx.type === 'write-off' ? 'Списание' : tx.type === 'adjustment' ? 'Коррекция' : tx.type === 'replacement' ? 'Замена' : tx.type}
                  </p>
                  <p className="text-[10px] text-white/40">{tx.mixes?.name || '—'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono font-bold ${tx.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.quantity > 0 ? '+' : ''}{tx.quantity} {tx.unit}
                </span>
                <p className="text-[9px] text-white/30">{new Date(tx.created_at).toLocaleString()}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {lowStock.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-10">Все позиции в норме</p>
          ) : (
            lowStock.map(m => (
              <GlassCard key={m.id} className="p-4 flex items-center justify-between border-red-400/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{m.name}</p>
                    <p className="text-[10px] text-white/40">{m.brand}</p>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-red-400">{m.stock_quantity} {m.unit}</span>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {showPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <GlassCard className="p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Добавить закупку</h3>

            <div className="space-y-2">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">Микс</label>
              <select
                value={purchaseData.mix_id}
                onChange={e => setPurchaseData(p => ({ ...p, mix_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
              >
                <option value="">Выберите микс</option>
                {mixes.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.brand})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] text-white/50 uppercase tracking-wider">Количество (г)</label>
                <input
                  type="number"
                  value={purchaseData.quantity}
                  onChange={e => setPurchaseData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/50 uppercase tracking-wider">Цена (₽)</label>
                <input
                  type="number"
                  value={purchaseData.price}
                  onChange={e => setPurchaseData(p => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPurchase(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold text-white/60 hover:text-white transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handlePurchase}
                disabled={!purchaseData.mix_id}
                className="flex-1 py-2.5 rounded-xl bg-accent-gold text-black text-[10px] font-bold disabled:opacity-50 hover:bg-accent-gold/90 transition-all"
              >
                Добавить
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </motion.div>
  );
}
