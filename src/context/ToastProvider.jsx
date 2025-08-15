
import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast/Toast';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToastQueue(prevQueue => [...prevQueue, { id, message, type, duration }]);
  }, []);

  const handleCloseToast = useCallback((id) => {
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
