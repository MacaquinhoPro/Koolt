"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, HelpCircle, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title = "Confirmar Acción",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isDestructive = true
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: '90%',
              maxWidth: '440px',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: 'none',
              textAlign: 'center'
            }}
          >
            <div style={{ 
              margin: '0 auto',
              background: isDestructive ? 'var(--danger-soft)' : 'var(--primary-soft)',
              padding: '1.25rem',
              borderRadius: '50%',
              width: 'fit-content'
            }}>
              {isDestructive ? (
                <AlertTriangle size={32} className="text-danger" />
              ) : (
                <HelpCircle size={32} className="text-primary" />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                {message}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={onCancel}
                className="btn btn-secondary"
                style={{ flex: 1, height: '3.5rem' }}
              >
                {cancelLabel}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={isDestructive ? "btn btn-danger" : "btn btn-primary"}
                style={{ 
                  flex: 1, 
                  height: '3.5rem',
                  background: isDestructive ? 'var(--danger)' : undefined,
                  color: isDestructive ? 'white' : undefined
                }}
              >
                {confirmLabel}
              </button>
            </div>

            <button 
              onClick={onCancel} 
              style={{ 
                position: 'absolute', 
                top: '1.25rem', 
                right: '1.25rem', 
                background: 'var(--bg-color)', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-muted)',
                borderRadius: '50%',
                padding: '0.4rem',
                display: 'flex'
              }}
            >
              <X size={18} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
