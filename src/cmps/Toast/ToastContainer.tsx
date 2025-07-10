import React from 'react';
import Toast, { ToastProps } from './Toast';
import '../../styles/components/toast.scss';

interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'bottom-left',
  onClose,
}) => {
  return (
    <div className={`toast-container toast-position-${position}`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;