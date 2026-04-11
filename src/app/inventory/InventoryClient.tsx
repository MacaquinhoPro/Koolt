"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertTriangle, Package, Save, CheckCircle2, CalendarDays } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowThreshold: number;
  expirationItems?: { id: string; expirationDate: string | Date }[];
};

export default function InventoryClient({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [savingId, setSavingId] = useState<string | null>(null);

  const lowStockItems = items.filter(item => item.quantity <= item.lowThreshold);

  const updateQuantity = async (id: string, newQuantity: number) => {
    setSavingId(id);
    const toastId = toast.loading('Actualizando...');
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQuantity })
      });
      if (res.ok) {
        setItems(items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
        toast.success("Inventario actualizado", { id: toastId });
      } else {
        toast.error("Error al actualizar inventario", { id: toastId });
      }
    } catch {
      toast.error("Error de red al actualizar", { id: toastId });
    } finally {
      setSavingId(null);
    }
  };

  const handleInputChange = (id: string, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setItems(items.map(i => i.id === id ? { ...i, quantity: num } : i));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Prepare chart data
  const chartData = items.map(item => ({
    name: item.name,
    Cantidad: item.quantity,
    Umbral: item.lowThreshold,
    isLow: item.quantity <= item.lowThreshold
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ backgroundColor: '#fee2e2', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #f87171', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ color: '#b91c1c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                <AlertTriangle size={24} /> Alertas de Bajo Stock
              </h2>
              <ul style={{ paddingLeft: '2rem', color: '#991b1b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {lowStockItems.map(item => (
                  <motion.li key={item.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <strong style={{ fontWeight: '600' }}>{item.name}:</strong> Quedan {item.quantity} {item.unit} (Umbral: {item.lowThreshold})
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graphical Inventory View */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Package size={24} className="text-secondary" /> Estado Actual del Inventario
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip 
               cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
               contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isLow ? 'var(--danger-red)' : 'var(--accent-blue)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '600' }}>Detalle y Edición</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Producto</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Unidad</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cantidad Actual</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Acciones</th>
            </tr>
          </thead>
          <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
            {items.map(item => {
              const isLow = item.quantity <= item.lowThreshold;
              const closeExpirations = (item.expirationItems || []).filter(e => differenceInDays(new Date(e.expirationDate), new Date()) <= 7);
              const hasAlerts = isLow || closeExpirations.length > 0;
              return (
                <motion.tr variants={itemVariants} key={item.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: hasAlerts ? '#fef2f2' : 'transparent', transition: 'background-color 0.3s' }}>
                  <td style={{ padding: '1.2rem 1rem', fontWeight: '500', color: hasAlerts ? '#b91c1c' : 'var(--text-primary)' }}>
                    {item.name}
                    {isLow && <span style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: '#f87171', color: 'white', fontSize: '0.8rem', fontWeight: '600' }}>Bajo</span>}
                    {closeExpirations.length > 0 && (
                      <span title={`${closeExpirations.length} lote(s) por vencer o vencido(s)`} style={{ marginLeft: '0.5rem', verticalAlign: 'middle', cursor: 'help' }}>
                        <CalendarDays size={16} color="#f59e0b" />
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1.2rem 1rem', color: 'var(--text-secondary)' }}>{item.unit}</td>
                  <td style={{ padding: '1.2rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="number" 
                        value={item.quantity}
                        min={0}
                        onChange={(e) => handleInputChange(item.id, e.target.value)}
                        style={{ 
                          width: '100px', 
                          padding: '0.6rem', 
                          borderRadius: 'var(--radius-sm)', 
                          border: `1px solid ${isLow ? '#f87171' : 'var(--border-color)'}`, 
                          outline: 'none',
                          fontFamily: 'inherit',
                          fontSize: '1rem',
                          background: 'white'
                        }}
                      />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ {item.lowThreshold} umbral</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem 1rem' }}>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-primary"
                      disabled={savingId === item.id}
                      onClick={() => updateQuantity(item.id, item.quantity)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {savingId === item.id ? <Save size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
                      {savingId === item.id ? 'Guardando...' : 'Guardar'}
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
