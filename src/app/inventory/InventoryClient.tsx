"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertTriangle, Package, Save, CheckCircle2, CalendarDays, Plus, Trash2, Edit2, X } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowThreshold: number;
  expirationItems?: { id: string; expirationDate: string | Date }[];
};

export default function InventoryClient({ initialItems }: { initialItems: InventoryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: '', lowThreshold: 5 });

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

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
        router.refresh();
      } else {
        toast.error("Error al actualizar inventario", { id: toastId });
      }
    } catch {
      toast.error("Error de red", { id: toastId });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newItem.name || !newItem.unit) {
      toast.error("Nombre y unidad son requeridos");
      return;
    }
    const toastId = toast.loading('Creando item...');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const created = await res.json();
        setItems([...items, created]);
        setIsAdding(false);
        setNewItem({ name: '', quantity: 0, unit: '', lowThreshold: 5 });
        toast.success("Item creado", { id: toastId });
        router.refresh();
      } else {
        toast.error("Error al crear", { id: toastId });
      }
    } catch {
      toast.error("Error de red", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;
    const toastId = toast.loading('Eliminando...');
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
        toast.success("Item eliminado", { id: toastId });
        router.refresh();
      } else {
        toast.error("Error al eliminar", { id: toastId });
      }
    } catch {
      toast.error("Error de red", { id: toastId });
    }
  };

  const handleSaveEdit = async (id: string) => {
    setSavingId(id);
    const toastId = toast.loading('Guardando cambios...');
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(items.map(item => item.id === id ? { ...item, ...updated } : item));
        setEditingId(null);
        toast.success("Item actualizado", { id: toastId });
        router.refresh();
      } else {
        toast.error("Error al actualizar", { id: toastId });
      }
    } catch {
      toast.error("Error de red", { id: toastId });
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

  const chartData = items.map(item => ({
    name: item.name,
    Cantidad: item.quantity,
    Umbral: item.lowThreshold,
    isLow: item.quantity <= item.lowThreshold
  }));

  const inputStyle = {
    padding: '0.6rem', 
    borderRadius: 'var(--radius-sm)', 
    border: '1px solid var(--border-color)', 
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '1rem',
    background: 'white',
    width: '100%'
  };

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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Package size={24} className="text-secondary" /> Estado Actual del Inventario
        </h2>
        <ResponsiveContainer width="100%" minHeight={300}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Detalle y Edición</h2>
          <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Añadir Item
          </button>
        </div>

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
            <AnimatePresence>
              {isAdding && (
                <motion.tr 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  style={{ backgroundColor: '#f0f9ff' }}
                >
                  <td style={{ padding: '1rem' }}>
                    <input type="text" placeholder="Nombre (ej: Vaso)" style={inputStyle} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <input type="text" placeholder="Unidad (ej: Unidades)" style={inputStyle} value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="number" placeholder="Cant" style={{...inputStyle, width: '80px'}} value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
                      <span style={{ fontSize: '0.9rem' }}>Umbral:</span>
                      <input type="number" placeholder="Umbral" style={{...inputStyle, width: '80px'}} value={newItem.lowThreshold} onChange={e => setNewItem({...newItem, lowThreshold: parseFloat(e.target.value)})} />
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={handleCreate}>Guardar</button>
                      <button className="btn btn-danger" onClick={() => setIsAdding(false)}>Cancelar</button>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>

            {items.map(item => {
              const isLow = item.quantity <= item.lowThreshold;
              const closeExpirations = (item.expirationItems || []).filter(e => differenceInDays(new Date(e.expirationDate), new Date()) <= 7);
              const hasAlerts = isLow || closeExpirations.length > 0;
              const isEditing = editingId === item.id;

              return (
                <motion.tr variants={itemVariants} key={item.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: hasAlerts && !isEditing ? '#fef2f2' : 'transparent', transition: 'background-color 0.3s' }}>
                  <td style={{ padding: '1.2rem 1rem', fontWeight: '500', color: hasAlerts && !isEditing ? '#b91c1c' : 'var(--text-primary)' }}>
                    {isEditing ? (
                      <input type="text" style={inputStyle} value={editForm.name ?? item.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    ) : (
                      <>
                        {item.name}
                        {isLow && <span style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: '#f87171', color: 'white', fontSize: '0.8rem', fontWeight: '600' }}>Bajo</span>}
                        {closeExpirations.length > 0 && (
                          <span title={`${closeExpirations.length} lote(s) por vencer o vencido(s)`} style={{ marginLeft: '0.5rem', verticalAlign: 'middle', cursor: 'help' }}>
                            <CalendarDays size={16} color="#f59e0b" />
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td style={{ padding: '1.2rem 1rem', color: 'var(--text-secondary)' }}>
                    {isEditing ? (
                      <input type="text" style={inputStyle} value={editForm.unit ?? item.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                    ) : (
                      item.unit
                    )}
                  </td>
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
                      {isEditing ? (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                           <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ Umbral:</span>
                           <input type="number" style={{...inputStyle, width: '70px', padding: '0.4rem'}} value={editForm.lowThreshold ?? item.lowThreshold} onChange={e => setEditForm({...editForm, lowThreshold: parseFloat(e.target.value)})} />
                         </div>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ {item.lowThreshold} umbral</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem 1rem' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={() => handleSaveEdit(item.id)} disabled={savingId === item.id} style={{ padding: '0.5rem' }}>
                          {savingId === item.id ? <Save size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
                        </button>
                        <button className="btn btn-danger" onClick={() => { setEditingId(null); setEditForm({}); }} style={{ padding: '0.5rem' }}>
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-primary"
                          disabled={savingId === item.id}
                          onClick={() => updateQuantity(item.id, item.quantity)}
                          title="Guardar Cantidad"
                          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Save size={18} /> Guardar
                        </motion.button>
                        <button className="btn" style={{ padding: '0.5rem', background: '#f1f5f9', color: 'var(--text-primary)' }} onClick={() => { setEditingId(item.id); setEditForm(item); }} title="Editar item">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(item.id)} title="Eliminar item">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
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
