import { Modal } from './Modal';
import { GlowButton } from './GlowButton';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const Icon = variant === 'danger' ? Trash2 : AlertTriangle;
  const iconColor = variant === 'danger' ? 'text-red-400' : 'text-yellow-400';
  const iconBg = variant === 'danger' ? 'bg-red-500/10' : 'bg-yellow-500/10';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center space-y-4">
        <div className={`mx-auto w-14 h-14 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 pt-2">
          <GlowButton
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Отмена
          </GlowButton>
          <GlowButton
            variant="danger"
            size="md"
            onClick={onConfirm}
            className="flex-1"
            loading={loading}
          >
            {confirmText}
          </GlowButton>
        </div>
      </div>
    </Modal>
  );
}

