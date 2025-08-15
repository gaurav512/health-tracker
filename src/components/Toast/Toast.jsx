
import React from 'react';
import styles from './Toast.module.css';

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const toastClass = `${styles.toast} ${styles[type || 'info']}`;

  return (
    <div className={toastClass}>
      <span>{message}</span>
      <button onClick={onClose} className={styles.closeButton}>×</button>
    </div>
  );
};

export default Toast;
