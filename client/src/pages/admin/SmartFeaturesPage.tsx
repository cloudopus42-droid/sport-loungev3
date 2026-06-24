import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, RefreshCw } from 'lucide-react';
import { SettingsIcon, CloseIcon } from '@/components/icons';
import { GlowButton } from '@/components/ui/GlowButton';
import { showToast } from '@/components/NotificationToast';
import api from '@/lib/api';
import type { SmartFeature } from '@/types';

function ToggleSwitch({
  enabled,
  loading,
  onChange,
}: {
  enabled: boolean;
  loading: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      className="relative w-14 h-7 rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: enabled ? '#FFBF00' : 'rgba(255,255,255,0.1)' }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 28" fill="none">
        <motion.circle
          cx={enabled ? 44 : 20}
          cy={14}
          r={10}
          fill="white"
          animate={{ cx: enabled ? 44 : 20 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-white/10 rounded" />
        <div className="h-7 w-14 bg-white/10 rounded-full" />
      </div>
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="h-3 w-3/4 bg-white/5 rounded" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 w-20 bg-white/10 rounded" />
        <div className="h-8 w-8 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function SmartFeaturesPage() {
  const [features, setFeatures] = useState<SmartFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<SmartFeature | null>(null);
  const [configText, setConfigText] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<SmartFeature[]>('/api/smart-features');
      setFeatures(Array.isArray(data) ? data : []);
    } catch {
      showToast('Ошибка загрузки функций', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchFeatures();
    return () => ac.abort();
  }, [fetchFeatures]);

  const handleToggle = async (feature: SmartFeature) => {
    const newEnabled = !feature.enabled;
    const featureId = feature.id || feature.feature_key;
    if (!featureId) {
      showToast('Ошибка: ID функции не найден', 'error');
      return;
    }
    setTogglingIds((prev) => new Set(prev).add(feature.id));
    setFeatures((prev) =>
      prev.map((f) => (f.id === feature.id ? { ...f, enabled: newEnabled } : f))
    );
    try {
      await api(`/api/smart-features/${feature.id}`, { method: 'PUT', body: { enabled: newEnabled } });
      showToast(
        `${feature.name} ${newEnabled ? 'включена' : 'отключена'}`,
        'success'
      );
    } catch (err: any) {
      setFeatures((prev) =>
        prev.map((f) => (f.id === feature.id ? { ...f, enabled: !newEnabled } : f))
      );
      showToast(`Ошибка обновления ${feature.name}: ${err?.message || 'неизвестная ошибка'}`, 'error');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(feature.id);
        return next;
      });
    }
  };

  const openEditModal = (feature: SmartFeature) => {
    setEditingFeature(feature);
    setConfigText(JSON.stringify(feature.config, null, 2));
    setEditModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!editingFeature) return;
    setSavingConfig(true);
    try {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(configText);
      } catch {
        showToast('Некорректный JSON', 'error');
        setSavingConfig(false);
        return;
      }
      const data = await api<SmartFeature>(
        `/api/smart-features/${editingFeature.id}`,
        { method: 'PUT', body: { config: parsed } }
      );
      setFeatures((prev) =>
        prev.map((f) => (f.id === editingFeature.id ? data : f))
      );
      showToast('Конфигурация сохранена', 'success');
      setEditModalOpen(false);
      setEditingFeature(null);
    } catch {
      showToast('Ошибка сохранения конфигурации', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Smart <span className="text-accent-gold">Features</span>
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Управление функциями</p>
        </div>
        <GlowButton variant="secondary" onClick={fetchFeatures}>
          <RefreshCw className="w-4 h-4" />
          Обновить
        </GlowButton>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : features.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-20 text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <SettingsIcon className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Нет доступных функций</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-base">{feature.name}</h3>
                  <ToggleSwitch
                    enabled={feature.enabled}
                    loading={togglingIds.has(feature.id)}
                    onChange={() => handleToggle(feature)}
                  />
                </div>
                <p className="text-white/50 text-sm mb-3 line-clamp-2">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/40 tracking-tight">
                    {feature.feature_key}
                  </span>
                  <motion.button
                    className="p-1.5 rounded-lg text-white/30 hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
                    onClick={() => openEditModal(feature)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {editModalOpen && editingFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setEditModalOpen(false); setEditingFeature(null); }}
            />
            <motion.div
              className="relative w-full max-w-lg bg-dark-surface/95 backdrop-blur-glass border border-glass-border rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
                <h2 className="text-lg font-display font-semibold text-white">
                  {editingFeature.name}
                </h2>
                <motion.button
                  className="p-1.5 rounded-lg bg-glass-bg border border-glass-border text-white/60 hover:text-white hover:border-accent-gold/40 transition-colors"
                  onClick={() => { setEditModalOpen(false); setEditingFeature(null); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CloseIcon className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs text-white/40 font-mono">{editingFeature.feature_key}</p>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">
                    JSON Config
                  </label>
                  <textarea
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    className="w-full min-h-[200px] bg-black/30 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/80 resize-none focus:outline-none focus:border-accent-gold/40 transition-colors"
                    spellCheck={false}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <GlowButton
                    variant="secondary"
                    type="button"
                    onClick={() => { setEditModalOpen(false); setEditingFeature(null); }}
                  >
                    Cancel
                  </GlowButton>
                  <GlowButton
                    variant="primary"
                    type="button"
                    loading={savingConfig}
                    onClick={handleSaveConfig}
                  >
                    Save
                  </GlowButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
