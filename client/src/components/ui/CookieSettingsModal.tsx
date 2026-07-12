import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { CookieConsent, CookieCategory } from '@/hooks/useCookieConsent';

interface Props {
  consent: CookieConsent;
  onSave: (consent: Partial<CookieConsent>) => void;
  onClose: () => void;
}

const CATEGORIES: { key: CookieCategory; label: string; description: string; required?: boolean }[] = [
  { key: 'necessary', label: 'Необходимые', description: 'Обеспечивают работу сайта: авторизация, корзина, безопасность.', required: true },
  { key: 'analytics', label: 'Аналитические', description: 'Помогают нам улучшать сайт: посещаемость, поведение пользователей.' },
  { key: 'functional', label: 'Функциональные', description: 'Запоминают ваши настройки и предпочтения.' },
  { key: 'marketing', label: 'Рекламные', description: 'Используются для показа релевантной рекламы.' },
];

export function CookieSettingsModal({ consent, onSave, onClose }: Props) {
  const [local, setLocal] = useState(consent);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md rounded-2xl bg-[rgba(15,12,10,0.5)] backdrop-blur-[20px] border border-[rgba(255,191,0,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-heading font-bold text-white">Настройки куки</h2>
            <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white/70 rounded-lg transition-colors" aria-label="Закрыть">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{cat.label}</span>
                    {cat.required && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-gold-bright/10 text-accent-gold-bright font-medium">обязательно</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">{cat.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={local[cat.key]}
                    disabled={cat.required}
                    onChange={() => setLocal(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-accent-gold-bright/30 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white/60 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-accent-gold-bright" />
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(local)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent-gold-bright/20 border border-accent-gold-bright/30 text-accent-gold-bright text-xs font-semibold hover:bg-accent-gold-bright/30 transition-all"
            >
              Сохранить настройки
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-white/40 text-xs hover:text-white/60 transition-all">
              Отмена
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
