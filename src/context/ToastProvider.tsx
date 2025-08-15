import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/Toast/Toast';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'info' | 'success' | 'error', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [toastQueue, setToastQueue] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
    const id = Date.now();
    setToastQueue(prevQueue => [...prevQueue, { id, message, type, duration }]);
  }, []);

  const handleCloseToast = useCallback((id: number) => {
    setToastQueue(prevQueue => prevQueue.filter(t => t.id !== id));
  }, []);

  // Effect to manage the display of toasts from the queue
  React.useEffect(() => {
    if (toastQueue.length > 0 && !toast) {
      const nextToast = toastQueue[0];
      setToast(nextToast);
      const timer = setTimeout(() => {
        handleCloseToast(nextToast.id);
        setToast(null); // Clear current toast after its duration
      }, nextToast.duration);
      return () => clearTimeout(timer);
    }
  }, [toastQueue, toast, handleCloseToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => handleCloseToast(toast.id)} 
        />
      )}
    </ToastContext.Provider>
  );
};