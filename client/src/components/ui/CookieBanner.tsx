import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X } from 'lucide-react';
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
            className="fixed bottom-0 left-0 right-0 z-[100] p-4"
          >
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-2xl p-5 bg-[rgba(15,12,10,0.5)] backdrop-blur-[20px] border border-[rgba(255,191,0,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <button
                  onClick={dismissBanner}
                  className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white/70 transition-colors rounded-lg"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-accent-gold-bright/10 flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-4 h-4 text-accent-gold-bright" />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-bold text-white">Мы используем куки</h3>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">
                      Чтобы сайт работал корректно и мы могли улучшать ваш опыт. Вы можете настроить или отключить необязательные куки.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-accent-gold-bright/20 border border-accent-gold-bright/30 text-accent-gold-bright text-xs font-semibold hover:bg-accent-gold-bright/30 transition-all"
                  >
                    Принять все
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition-all"
                  >
                    <Settings className="w-3 h-3" /> Настроить
                  </button>
                  <button
                    onClick={rejectAll}
                    className="px-4 py-2.5 rounded-xl text-white/40 text-xs hover:text-white/60 transition-all"
                  >
                    Отклонить
                  </button>
                </div>
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
