import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import failureSound from '../Failure-Final.wav';
import successSound from '../Email-Notification-Quick-Note.wav';

export function showToast(message: string, variant: 'success' | 'error' | 'info' = 'info') {
  // Play sound effect based on toast variant
  try {
    if (variant === 'error') {
      const audio = new Audio(failureSound);
      audio.volume = 0.10; // 10% volume
      audio.play().catch((e) => console.log('Audio playback failed:', e.message));
    } else if (variant === 'success') {
      const audio = new Audio(successSound);
      audio.volume = 0.10; // 10% volume
      audio.play().catch((e) => console.log('Audio playback failed:', e.message));
    }
  } catch (err) {
    console.warn('Toast sound play error:', err);
  }

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-accent-gold flex-shrink-0" />,
  };

  const glowColors = {
    success: 'border-green-500/30 shadow-glow-green',
    error: 'border-red-500/30 shadow-glow-red',
    info: 'border-accent-gold/30 shadow-glow-gold',
  };

  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-surface/95 backdrop-blur-glass border ${glowColors[variant]} transition-all ${
          t.visible ? 'animate-fadeInUp' : 'opacity-0 translate-y-2'
        }`}
      >
        {icons[variant]}
        <p className="text-sm text-white/90">{message}</p>
      </div>
    ),
    {
      duration: 4000,
      position: 'top-right',
    }
  );
}

