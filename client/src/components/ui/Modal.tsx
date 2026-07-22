import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md max-w-[calc(100vw-2rem)]',
  md: 'max-w-lg max-w-[calc(100vw-2rem)]',
  lg: 'max-w-2xl max-w-[calc(100vw-2rem)]',
  xl: 'max-w-4xl max-w-[calc(100vw-2rem)]',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className={clsx(
              'relative w-full bg-dark-surface/95 backdrop-blur-glass border border-glass-border rounded-2xl shadow-2xl overflow-hidden',
              sizeClasses[size]
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-glass-border">
              <h2 className="text-base sm:text-lg font-display font-semibold text-white">{title}</h2>
              <button
                className="p-2.5 rounded-lg bg-glass-bg border border-glass-border text-white/60 hover:text-white hover:border-accent-gold/40 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 max-h-[85vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

