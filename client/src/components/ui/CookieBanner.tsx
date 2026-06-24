import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeature } from '@/contexts/FeatureContext';
import { CookieSettingsModal } from './CookieSettingsModal';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export function CookieBanner() {
  const { isFeatureEnabled } = useFeature();
  const { isBannerVisible, acceptAll, rejectAll, dismissBanner, consent, setConsent } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  if (!isFeatureEnabled('cookie_consent')) return null;
  if (!isBannerVisible) return null;

  return (
    <>
      <AnimatePresence>
        {isBannerVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-5 right-5 z-[100] max-w-sm"
          >
            <div className="rounded-xl p-4 bg-[#000000] border border-[#4d4d4d]/30">
              <p className="text-sm text-white/80 leading-relaxed mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Мы используем куки для корректной работы сайта и улучшения вашего опыта.{' '}
                <a href="/cookie-policy" className="underline text-[#c6c6c6] hover:text-white transition-colors">
                  Политика конфиденциальности
                </a>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={acceptAll}
                  className="flex-1 px-4 py-1.5 rounded text-[11px] uppercase tracking-wider bg-[#343755] text-white hover:bg-[#3d4066] transition-colors"
                  style={{ fontFamily: '"Space Mono", monospace' }}
                >
                  Принять
                </button>
                <button
                  onClick={rejectAll}
                  className="flex-1 px-4 py-1.5 rounded text-[11px] uppercase tracking-wider bg-transparent border border-[#999999]/50 text-white/60 hover:text-white hover:border-[#999999] transition-colors"
                  style={{ fontFamily: '"Space Mono", monospace' }}
                >
                  Отклонить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSettings && (
        <CookieSettingsModal
          consent={consent}
          onSave={(updated) => { setConsent(updated); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
