// src/cmps/ConfirmDialog.tsx
import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  type = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className='confirm-dialog'>
      <div className='overlay' onClick={onClose}></div>
      <div className='dialog-content'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h3 className={`dialog-title ${type}`}>{title}</h3>

        <div className='dialog-message'>{message}</div>

        <div className='dialog-actions'>
          <button
            type='button'
            className={`btn ${type}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>

          <button type='button' className='btn secondary' onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
