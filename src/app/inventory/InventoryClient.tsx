"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  Package, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit2, 
  X,
  History,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
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
        toast.success("Inventario actualizado", { id: toastId });
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

  const handleCreate = async () => {
    if (!newItem.name || !newItem.unit) {
      toast.error("Nombre y unidad son requeridos");
      return;
    }
    const toastId = toast.loading('Creando...');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
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
    if (!confirm('¿Eliminar este insumo definitivamente?')) return;
    const toastId = toast.loading('Eliminando...');
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
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
    const toastId = toast.loading('Guardando...');
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
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

  const chartData = items.map(item => ({
    name: item.name,
    Cantidad: item.quantity,
    Umbral: item.lowThreshold,
    isLow: item.quantity <= item.lowThreshold
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '3rem' }}>
      
      {/* Alertas de Bajo Stock - Premium Alert */}
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div style={{ 
              backgroundColor: 'var(--danger-soft)', 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--danger)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h2 style={{ 
                color: 'var(--danger)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                fontSize: '1.25rem', 
                fontWeight: '800' 
              }}>
                <AlertTriangle size={28} /> Alerta Crítica de Stock
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {lowStockItems.map(item => (
                  <div key={item.id} style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700' }}>{item.name}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: '800' }}>{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Gráfico de Estado */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card" 
          style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingDown className="text-primary" /> Distribución de Stock
             </h2>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Consumo en Tiempo Real</span>
          </div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={12} width={100} />
                <Tooltip 
                  cursor={{ fill: 'var(--primary-soft)' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                />
                <Bar dataKey="Cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isLow ? 'var(--danger)' : 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Resumen & Métricas Rápidas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'var(--primary-soft)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <Package size={32} className="text-primary" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ítems en Inventario</h3>
              <p style={{ fontSize: '2rem', fontWeight: '800' }}>{items.length}</p>
            </div>
          </div>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'var(--danger-soft)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Insumos por Agotarse</h3>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--danger)' }}>{lowStockItems.length}</p>
            </div>
          </div>
          <button className="btn btn-primary" style={{ height: '4rem', width: '100%' }} onClick={() => setIsAdding(true)}>
             <Plus /> Nuevo Insumo
          </button>
        </div>
      </div>

      {/* Tabla de Detalle - Data Grid Format */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History className="text-primary" /> Inventario Detallado
          </h2>
        </div>

        <div className="data-table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Producto / Recurso</th>
                <th>Unidad</th>
                <th>Stock Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence mode="popLayout">
                {isAdding && (
                  <motion.tr 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'var(--bg-color)' }}
                  >
                    <td>
                      <input type="text" placeholder="Nombre" style={{ width: '100%' }} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </td>
                    <td>
                      <input type="text" placeholder="Ej. Litros" style={{ width: '100%' }} value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input type="number" placeholder="Cant" style={{ width: '80px' }} value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Umbral" style={{ width: '80px' }} value={newItem.lowThreshold} onChange={e => setNewItem({...newItem, lowThreshold: parseFloat(e.target.value)})} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleCreate}>Guardar</button>
                        <button className="btn" onClick={() => setIsAdding(false)}>Cancelar</button>
                      </div>
                    </td>
                  </motion.tr>
                )}

                {items.map(item => {
                  const isLow = item.quantity <= item.lowThreshold;
                  const isEditing = editingId === item.id;

                  return (
                    <motion.tr variants={itemVariants} key={item.id} style={{ background: isLow && !isEditing ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                      <td style={{ fontWeight: '700' }}>
                        {isEditing ? (
                          <input type="text" style={{ width: '100%' }} value={editForm.name ?? item.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.name}
                            {isLow && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.7rem', fontWeight: '800' }}>BAJO</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input type="text" style={{ width: '100%' }} value={editForm.unit ?? item.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                        ) : (
                          item.unit
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '800', 
                            color: isLow ? 'var(--danger)' : 'var(--text-primary)' 
                          }}>
                            {item.quantity}
                          </span>
                          {!isEditing && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ Min: {item.lowThreshold}</span>}
                          {isEditing && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span>/ Min</span>
                              <input type="number" style={{ width: '80px' }} value={editForm.lowThreshold ?? item.lowThreshold} onChange={e => setEditForm({...editForm, lowThreshold: parseFloat(e.target.value)})} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary" onClick={() => handleSaveEdit(item.id)} disabled={savingId === item.id}>
                              <CheckCircle2 size={18} /> Confirmar
                            </button>
                            <button className="btn btn-danger" onClick={() => setEditingId(null)}>
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => { setEditingId(item.id); setEditForm(item); }} title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button className="btn btn-danger" style={{ padding: '0.5rem', background: 'transparent' }} onClick={() => handleDelete(item.id)} title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
