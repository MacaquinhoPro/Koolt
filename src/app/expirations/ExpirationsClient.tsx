"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, PackagePlus, Trash2, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import ConfirmModal from '@/components/ConfirmModal';
import CustomSelect from '@/components/CustomSelect';

type ExpirationItem = {
  id: string;
  inventoryItemId: string;
  inventoryItem: { id: string; name: string };
  quantity: number;
  expirationDate: string | Date;
  notes: string | null;
};

type InventoryLite = {
  id: string;
  name: string;
};

export default function ExpirationsClient({ initialItems, inventoryItems }: { initialItems: ExpirationItem[], inventoryItems: InventoryLite[] }) {
  const [items, setItems] = useState<ExpirationItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Confirm Modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    inventoryItemId: '',
    quantity: 1,
    expirationDate: '',
    notes: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.expirationDate || !newItem.inventoryItemId) {
      toast.error('Complete los datos obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/expirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          expirationDate: new Date(newItem.expirationDate).toISOString()
        })
      });
      if (res.ok) {
        const added = await res.json();
        setItems(prev => [...prev, added].sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
        setNewItem({ inventoryItemId: '', quantity: 1, expirationDate: '', notes: '' });
        setIsAdding(false);
        toast.success('Registro añadido exitosamente');
      } else {
        toast.error('Error al añadir');
      }
    } catch (err) {
      toast.error('Error del servidor');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    
    try {
      const res = await fetch(`/api/expirations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success('Eliminado');
      } else {
        toast.error('Error al eliminar');
      }
    } catch (err) {
      toast.error('Error del servidor');
    } finally {
      setDeleteId(null);
    }
  };

  const exportExcel = () => {
    const wsData = items.map(item => ({
      'Producto': item.inventoryItem?.name || 'Desconocido',
      'Cantidad': item.quantity,
      'Fecha Vencimiento': format(new Date(item.expirationDate), 'dd/MM/yyyy'),
      'Días Restantes': differenceInDays(new Date(item.expirationDate), new Date()),
      'Notas': item.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vencimientos");
    XLSX.writeFile(wb, `Vencimientos_Koolt_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PackagePlus size={18} /> {isAdding ? 'Cancelar' : 'Añadir Registro'}
        </button>
        
        <button className="btn btn-success" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={18} /> Exportar Excel
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card" 
            style={{ marginBottom: '2rem', border: '1px solid var(--accent-blue)' }}
          >
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>Nuevo Registro</h2>
            <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Producto del Inventario *</label>
                <CustomSelect 
                  options={inventoryItems.map(inv => ({ value: inv.id, label: inv.name }))}
                  value={newItem.inventoryItemId}
                  onChange={(val) => setNewItem({...newItem, inventoryItemId: val})}
                  placeholder="Selecciona un producto..."
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cantidad *</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step="0.1" 
                  value={newItem.quantity} 
                  onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fecha de Vencimiento *</label>
                <input 
                  type="date" 
                  value={newItem.expirationDate} 
                  onChange={e => setNewItem({...newItem, expirationDate: e.target.value})} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notas (Opcional)</label>
                <input 
                  type="text" 
                  value={newItem.notes} 
                  onChange={e => setNewItem({...newItem, notes: e.target.value})} 
                  placeholder="Proveedor, bodega..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.8rem' }}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <AnimatePresence>
          {items.map(item => {
            const daysLeft = differenceInDays(new Date(item.expirationDate), new Date());
            let statusColor = 'var(--success-green)';
            let statusBg = '#dcfce7';
            if (daysLeft < 0) {
              statusColor = 'var(--danger-red)';
              statusBg = '#fee2e2';
            } else if (daysLeft <= 7) {
              statusColor = '#f59e0b';
              statusBg = '#fef3c7';
            }

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card"
                style={{ borderLeft: `5px solid ${statusColor}`, position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{item.inventoryItem?.name || 'Insumo Borrado'}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Cantidad de lote: {item.quantity}
                    </p>
                  </div>
                  <button onClick={() => requestDelete(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer', padding: '0.3rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div style={{ background: statusBg, padding: '0.8rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarDays size={18} color={statusColor} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: statusColor, fontWeight: '600', fontSize: '0.9rem' }}>
                      Expira: {format(new Date(item.expirationDate), 'dd MMM yyyy', { locale: es })}
                    </p>
                    <p style={{ color: statusColor, fontSize: '0.8rem', opacity: 0.8 }}>
                      {daysLeft < 0 ? `Expiró hace ${Math.abs(daysLeft)} días` : `Faltan ${daysLeft} días`}
                    </p>
                  </div>
                  {daysLeft <= 7 && <AlertTriangle size={18} color={statusColor} />}
                </div>

                {item.notes && (
                  <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Nota: {item.notes}
                  </p>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {items.length === 0 && !isAdding && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <CalendarDays size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <p>No hay registros de vencimiento.</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Eliminar Registro"
        message="¿Estás seguro de que deseas eliminar esta fecha de vencimiento? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
