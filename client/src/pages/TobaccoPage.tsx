import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Leaf } from 'lucide-react';
import { TOBACCO_BRANDS } from '@/data/tobaccoBrands';
import api from '@/lib/api';

interface TobaccoItem {
  _id: string;
  name: string;
  brand?: string;
  flavor?: string;
  description?: string;
  image_url?: string;
  price?: number;
  stock_quantity: number;
  weight_grams?: number;
  is_active?: boolean;
}

export function TobaccoPage() {
  const [items, setItems] = useState<TobaccoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api('/api/tobacco');
      setItems(Array.isArray(data) ? data.filter((i: TobaccoItem) => i.is_active !== false) : []);
    } catch {
      console.error('Failed to load tobacco');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const brands = TOBACCO_BRANDS.map((b) => b.name).sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.flavor || '').toLowerCase().includes(search.toLowerCase());
    const matchesBrand = !selectedBrand || item.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const itemsByBrand = filteredItems.reduce<Record<string, TobaccoItem[]>>((acc, item) => {
    const b = item.brand || 'Другое';
    if (!acc[b]) acc[b] = [];
    acc[b].push(item);
    return acc;
  }, {});

  const brandLogos: Record<string, string> = {
    Darkside: 'DS', 'Must Have': 'MH', Element: 'EL', 'Black Burn': 'BB',
    Tangiers: 'TQ', Serbetli: 'SR', OASIS: 'OA', Duft: 'DF',
    Satyr: 'ST', Cloud9: 'C9', Blow: 'BL', Padrino: 'PD',
    'Hookah Freak': 'HF', Overdozz: 'OD', 'Daily Hookah': 'DH',
    Dschinni: 'DJ', Scream: 'SC', Fumari: 'FM', Starbuzz: 'SB',
    'Al Fakher': 'AF', Nakhla: 'NK', Uncharted: 'UC',
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-accent-gold" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Табачная карта</h1>
            <p className="text-sm text-white/40">Выберите любимый бренд и вкус для вашего кальяна</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Search & Filters */}
        <motion.div
          className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-dark-bg/90 backdrop-blur-lg border-b border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по бренду или вкусу..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 transition-colors"
              />
            </div>
          </div>
          {/* Brand pills */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedBrand(null)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                !selectedBrand
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/5 text-white/50 hover:text-white/80 border border-white/10'
              }`}
            >
              Все бренды
            </button>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(selectedBrand === b ? null : b)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedBrand === b
                    ? 'bg-accent-gold text-black'
                    : 'bg-white/5 text-white/50 hover:text-white/80 border border-white/10'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              {search || selectedBrand ? 'Ничего не найдено' : 'Табак пока не добавлен'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {Object.entries(itemsByBrand).map(([brand, brandItems]) => {
              const brandData = TOBACCO_BRANDS.find((b) => b.name === brand);
              return (
                <motion.div
                  key={brand}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  {/* Brand header */}
                  <div className="flex items-center gap-3 p-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent-gold">
                        {brandLogos[brand] || brand.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">{brand}</h2>
                      <p className="text-[10px] text-white/30">
                        {brandData?.country || '—'} • {brandItems.length} вкус{brandItems.length === 1 ? '' : brandItems.length < 5 ? 'а' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Flavors grid */}
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                    {brandItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-accent-gold/20 transition-all group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-white/80 font-medium truncate">{item.flavor || item.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.weight_grams && (
                              <span className="text-[10px] text-white/25">{item.weight_grams}г</span>
                            )}
                            {item.price != null && item.price > 0 && (
                              <span className="text-[10px] text-accent-gold/60">{item.price} ₽</span>
                            )}
                          </div>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-2 ${
                          item.stock_quantity > 0 ? 'bg-green-400' : 'bg-red-400'
                        }`} title={item.stock_quantity > 0 ? `В наличии: ${item.stock_quantity}` : 'Нет в наличии'} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info footer */}
        {!loading && filteredItems.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-[10px] text-white/20">
              Зелёный точка — в наличии • Красный — нет в наличии
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
