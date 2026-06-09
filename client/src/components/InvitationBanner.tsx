import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, PartyPopper } from 'lucide-react';
import type { Invitation } from '@/types';

interface InvitationBannerProps {
  invitation: Invitation;
  onClose: () => void;
}

export function InvitationBanner({ invitation, onClose }: InvitationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400);
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  const formattedDate = new Date(invitation.dateTime).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = new Date(invitation.dateTime).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[90] p-4"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="max-w-lg mx-auto bg-dark-surface/95 backdrop-blur-glass border border-accent-cyan/30 rounded-2xl shadow-glow-cyan overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                <PartyPopper className="w-5 h-5 text-accent-cyan" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1">
                  Новое приглашение!
                </p>
                <p className="text-sm font-display text-accent-cyan truncate">
                  {invitation.title}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate} {formattedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {invitation.location}
                  </span>
                </div>
              </div>

              <motion.button
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Glow accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
