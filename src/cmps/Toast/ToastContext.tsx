import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ToastContainer from './ToastContainer';
import { ToastType } from './Toast';
<<<<<<< Updated upstream
import { SanitizedError } from '../../utils/errorHandler';
=======
>>>>>>> Stashed changes

export interface ToastOptions {
  type: ToastType;
  message: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  onUndo?: () => void;
<<<<<<< Updated upstream
  errorId?: string;
  developerMessage?: string;
=======
>>>>>>> Stashed changes
}

export interface ToastItem extends ToastOptions {
  id: string;
}

export interface ToastContextType {
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
<<<<<<< Updated upstream
  showError: (error: SanitizedError | Error | string) => string;
  showSuccess: (message: string) => string;
  showWarning: (message: string) => string;
  showInfo: (message: string) => string;
=======
>>>>>>> Stashed changes
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, ...options }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

<<<<<<< Updated upstream
  const showError = useCallback((error: SanitizedError | Error | string) => {
    let message: string;
    let errorId: string | undefined;
    let developerMessage: string | undefined;
    
    if (typeof error === 'string') {
      message = error;
    } else if ('userMessage' in error) {
      // SanitizedError
      message = error.userMessage;
      errorId = error.errorId;
      developerMessage = error.developerMessage;
    } else if ('message' in error) {
      // Error object
      message = error.message;
      errorId = (error as any).errorId;
      developerMessage = (error as any).developerMessage;
    } else {
      message = 'אירעה שגיאה. אנא נסה שוב מאוחר יותר.';
    }
    
    return addToast({
      type: 'danger',
      message,
      errorId,
      developerMessage,
      autoClose: true,
      autoCloseTime: 6000
    });
  }, [addToast]);

  const showSuccess = useCallback((message: string) => {
    return addToast({
      type: 'success',
      message,
      autoClose: true,
      autoCloseTime: 4000
    });
  }, [addToast]);

  const showWarning = useCallback((message: string) => {
    return addToast({
      type: 'warning',
      message,
      autoClose: true,
      autoCloseTime: 5000
    });
  }, [addToast]);

  const showInfo = useCallback((message: string) => {
    return addToast({
      type: 'info',
      message,
      autoClose: true,
      autoCloseTime: 4000
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ 
      addToast, 
      removeToast, 
      removeAllToasts, 
      showError, 
      showSuccess, 
      showWarning, 
      showInfo 
    }}>
=======
  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeAllToasts }}>
>>>>>>> Stashed changes
      {children}
      <ToastContainer
        toasts={toasts.map((toast) => ({
          ...toast,
          onClose: removeToast,
        }))}
        position={position}
        onClose={removeToast}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;