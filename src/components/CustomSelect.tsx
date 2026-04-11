"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function CustomSelect({ options, value, onChange, placeholder = "Seleccionar...", style }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', minWidth: '200px', ...style }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.8rem 1rem',
          backgroundColor: 'var(--bg-light)',
          border: `1px solid ${isOpen ? 'var(--accent-blue)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          userSelect: 'none',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          boxShadow: isOpen ? '0 0 0 2px rgba(96, 165, 250, 0.2)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} color="var(--text-secondary)" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                No hay opciones disponibles
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: '0.25rem', margin: 0 }}>
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li 
                      key={option.value}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '0.6rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--accent-lt-blue)' : 'transparent',
                        color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-light)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? '600' : '400' }}>{option.label}</span>
                      {isSelected && <Check size={16} color="var(--accent-blue)" />}
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
