"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          backgroundColor: 'white',
          border: `2px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          userSelect: 'none',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow: isOpen ? '0 0 0 4px var(--primary-soft)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: '600'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-muted" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 1000,
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* Search Input for long lists */}
            {options.length > 5 && (
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={16} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    border: 'none', 
                    padding: '0.25rem', 
                    fontSize: '0.875rem', 
                    width: '100%',
                    background: 'transparent'
                  }}
                />
              </div>
            )}

            <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '0.5rem' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '2rem 1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem' }}>
                  No se encontraron resultados
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {filteredOptions.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <motion.li 
                        key={option.value}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'var(--primary-soft)' : 'transparent',
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          transition: 'background-color 0.15s',
                          marginBottom: '2px'
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? '700' : '500' }}>{option.label}</span>
                        {isSelected && <Check size={18} className="text-primary" />}
                      </motion.li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
