import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function VersionBadge() {
  const [buildId, setBuildId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const bld = (window as any).__slBuildId;
    if (bld) {
      setBuildId(bld);
      setVisible(true);
    }
  }, []);

  if (!buildId || !visible) return null;

  const handleForceUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        Promise.all(regs.map((r) => r.unregister())).then(() => {
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 lg:bottom-4 right-4 z-[999] flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <button
          onClick={handleForceUpdate}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:border-accent-gold/40 transition-all text-[10px] font-mono text-white/40 hover:text-accent-gold cursor-pointer"
          title="Force Update: очистить кеш и обновить"
          aria-label="Принудительное обновление"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400/60 group-hover:bg-green-400 transition-colors" />
          <span>{buildId.substring(0, 8)}</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
