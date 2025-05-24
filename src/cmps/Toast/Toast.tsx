import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, Undo } from 'lucide-react';
import '../../styles/components/toast.scss';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  onUndo?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  onClose,
  onUndo,
  autoClose = true,
  autoCloseTime = 3000,
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose(id);
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'danger':
        return <XCircle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-message">{message}</div>
        <div className="toast-actions">
          {onUndo && (
            <button
              className="toast-undo-btn"
              onClick={() => {
                onUndo();
                onClose(id);
              }}
            >
              <Undo size={16} />
              <span>Undo</span>
            </button>
          )}
          <button className="toast-close-btn" onClick={() => onClose(id)}>
            <XCircle size={16} />
          </button>
        </div>
      </div>
      {autoClose && <div className="toast-progress" style={{ animationDuration: `${autoCloseTime}ms` }} />}
    </div>
  );
};

export default Toast;