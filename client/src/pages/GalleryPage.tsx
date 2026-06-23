import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/urls';

interface GalleryItem {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  created_at: string;
}

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fetchGallery = useCallback(async () => {
    try {
      const data = await api('/api/showcases');
      setItems(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') setSelectedIndex(prev => prev !== null ? Math.max(0, prev - 1) : null);
      if (e.key === 'ArrowRight') setSelectedIndex(prev => prev !== null ? Math.min(items.length - 1, prev + 1) : null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, items.length]);

  return (
    <div className="min-h-screen bg-dark-bg px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-bold text-white">Галерея</h1>
          <p className="text-sm text-white/50">Атмосфера SPORT LOUNGE в фотографиях</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-dark-surface animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Image className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">Галерея пока пуста</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <motion.button
                key={item.id}
                className="aspect-[4/3] rounded-2xl overflow-hidden bg-dark-surface border border-glass-border group cursor-pointer relative"
                onClick={() => setSelectedIndex(idx)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={resolveImageUrl(item.image_url)}
                  alt={item.title || ''}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {item.title && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-semibold truncate">{item.title}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/60 hover:text-white transition-colors z-10"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {selectedIndex > 0 && (
              <button
                className="absolute left-4 p-2 rounded-full bg-black/50 text-white/60 hover:text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex - 1); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {selectedIndex < items.length - 1 && (
              <button
                className="absolute right-4 p-2 rounded-full bg-black/50 text-white/60 hover:text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex + 1); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <motion.div
              className="max-w-4xl max-h-[85vh] mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resolveImageUrl(items[selectedIndex].image_url)}
                alt={items[selectedIndex].title || ''}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
              {items[selectedIndex].title && (
                <p className="text-sm text-white/80 mt-3 text-center">{items[selectedIndex].title}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
