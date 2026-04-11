"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

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
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: '90%',
              maxWidth: '400px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDestructive ? 'var(--danger-red)' : 'var(--accent-blue)' }}>
                <AlertCircle size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{title}</h3>
              </div>
              <button 
                onClick={onCancel} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {message}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                onClick={onCancel}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}
              >
                {cancelLabel}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onCancel(); // Autoclose on simple confirms
                }}
                className={isDestructive ? "btn" : "btn btn-primary"}
                style={{
                  padding: '0.6rem 1rem',
                  fontWeight: '500',
                  background: isDestructive ? 'var(--danger-red)' : undefined,
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
