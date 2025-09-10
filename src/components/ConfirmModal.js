import React from 'react';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.content}>
          {children}
        </div>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Annuler
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 