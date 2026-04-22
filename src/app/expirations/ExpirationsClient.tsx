"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, PackagePlus, Trash2, Download, AlertTriangle, ChevronRight, Clock, Box } from 'lucide-react';
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
  const router = useRouter();
  const [items, setItems] = useState<ExpirationItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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
        setNewItem({ inventoryItemId: '', quantity: 1, expirationDate: '', notes: '' });
        setIsAdding(false);
        toast.success('Lote registrado correctamente');
        router.refresh();
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
        toast.success('Registro eliminado');
        router.refresh();
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
    XLSX.writeFile(wb, `Vencimientos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock className="text-primary" /> Control de Lotes por Vencer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Gestión preventiva de mermas y calidad.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={exportExcel}>
            <Download size={18} /> Exportar Reporte
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
            <PackagePlus size={18} /> {isAdding ? 'Cancelar' : 'Registrar Lote'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card" 
            style={{ border: '1px solid var(--primary)' }}
          >
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus className="text-primary" /> Ingresar Nuevo Lote
            </h2>
            <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>Producto Insumo *</label>
                <CustomSelect 
                  options={inventoryItems.map(inv => ({ value: inv.id, label: inv.name }))}
                  value={newItem.inventoryItemId}
                  onChange={(val) => setNewItem({...newItem, inventoryItemId: val})}
                  placeholder="Selecciona producto..."
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>Cantidad del Lote *</label>
                <input 
                  type="number" min="0.1" step="0.1" 
                  value={newItem.quantity} 
                  onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} 
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>Fecha Vencimiento *</label>
                <input 
                  type="date" 
                  value={newItem.expirationDate} 
                  onChange={e => setNewItem({...newItem, expirationDate: e.target.value})} 
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>Notas Internas (Proveedor, Lote ID, etc)</label>
                <input 
                  type="text" 
                  value={newItem.notes} 
                  onChange={e => setNewItem({...newItem, notes: e.target.value})} 
                  placeholder="Ej: Lote #455 - Proveedor Alpina"
                  style={{ width: '100%' }}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '3rem' }}>
                {loading ? 'Procesando...' : 'Guardar Registro'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}
      >
        <AnimatePresence mode="popLayout">
          {items.map(item => {
            const daysLeft = differenceInDays(new Date(item.expirationDate), new Date());
            const isExpired = daysLeft < 0;
            const isCritical = daysLeft <= 7;
            
            let accentColor = 'var(--success)';
            let accentSoft = 'var(--success-soft)';
            if (isExpired) {
              accentColor = 'var(--danger)';
              accentSoft = 'var(--danger-soft)';
            } else if (isCritical) {
              accentColor = 'var(--warning)';
              accentSoft = 'var(--warning-soft)';
            }

            return (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card"
                style={{ 
                  borderTop: `4px solid ${accentColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '1rem' }}>
                      <Box className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{item.inventoryItem?.name || 'Insumo Borrado'}</h3>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cantidad: {item.quantity}</span>
                    </div>
                  </div>
                  <button onClick={() => requestDelete(item.id)} className="btn btn-danger" style={{ background: 'transparent', padding: '0.4rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div style={{ 
                  background: accentSoft, 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  border: `1px solid ${accentColor}15`
                }}>
                  <div style={{ background: accentColor, padding: '0.5rem', borderRadius: '50%', color: 'white' }}>
                    <CalendarDays size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: accentColor, fontWeight: '800', fontSize: '0.9375rem' }}>
                      {isExpired ? 'VENCIDO' : `Expira: ${format(new Date(item.expirationDate), 'dd MMM yyyy', { locale: es })}`}
                    </p>
                    <p style={{ color: accentColor, fontSize: '0.8125rem', fontWeight: '600', opacity: 0.9 }}>
                      {isExpired ? `Hace ${Math.abs(daysLeft)} días` : `Quedan ${daysLeft} días`}
                    </p>
                  </div>
                  {isCritical && <AlertTriangle size={22} color={accentColor} />}
                </div>

                {item.notes && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: 'var(--bg-color)', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    borderLeft: '2px solid var(--border-color)'
                  }}>
                    "{item.notes}"
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {items.length === 0 && !isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}
          >
            <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1.5rem' }}>
              <CalendarDays size={64} style={{ opacity: 0.2 }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Sin registros de vencimiento</h3>
            <p>Todo el inventario está al día.</p>
          </motion.div>
        )}
      </motion.div>

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Eliminar Registro"
        message="¿Estás seguro de eliminar este registro de vencimiento? Esta acción ajustará el control de stock pero no la cantidad física actual."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
