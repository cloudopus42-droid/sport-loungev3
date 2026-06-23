import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'sl_night_mode';

export function NightModeToggle() {
  const [nightMode, setNightMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(nightMode));
    document.documentElement.classList.toggle('night-mode', nightMode);
  }, [nightMode]);

  return (
    <button
      onClick={() => setNightMode(!nightMode)}
      className="p-2 rounded-xl bg-glass-bg border border-glass-border text-white/60 hover:text-accent-gold-bright hover:border-accent-gold-bright/30 transition-all"
      title={nightMode ? 'Выключить ночной режим' : 'Включить ночной режим'}
    >
      {nightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
