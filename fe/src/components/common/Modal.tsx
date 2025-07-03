import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { sharedStyles, combineStyles } from '@/lib/sharedStyles';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={combineStyles(sharedStyles.modal.overlay, sharedStyles.animation.fadeIn)}
      onClick={handleOverlayClick}
    >
      <div 
        className={combineStyles(
          sharedStyles.modal.content,
          sizeClasses[size],
          sharedStyles.animation.slideUp
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={sharedStyles.modal.header}>
          <h3 id="modal-title" className={sharedStyles.modal.title}>
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={sharedStyles.modal.closeButton}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {children}
        </div>
        
        {actions && (
          <div className={sharedStyles.modal.footer}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience components for common modal patterns
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}) {
  const buttonVariant = variant === 'danger' ? sharedStyles.button.danger : sharedStyles.button.primary;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      actions={
        <>
          <button
            onClick={onClose}
            className={combineStyles(sharedStyles.button.base, sharedStyles.button.outline)}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={combineStyles(sharedStyles.button.base, buttonVariant)}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className={sharedStyles.text.body}>{message}</p>
    </Modal>
  );
}