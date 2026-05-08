"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Package,
  Plus,
  Trash2,
  Edit2,
  History,
  TrendingDown,
  PackageCheck,
  Search,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import ConfirmModal from '@/components/ConfirmModal';

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
  useEffect(() => setItems(initialItems), [initialItems]);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: '', lowThreshold: 5 });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; unit: string; quantity: number; lowThreshold: number }>({
    name: '',
    unit: '',
    quantity: 0,
    lowThreshold: 5,
  });

  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const lowStockItems = items.filter(i => i.quantity <= i.lowThreshold);
  const okStockItems = items.filter(i => i.quantity > i.lowThreshold);

  const visible = items.filter(i => {
    const matches = i.name.toLowerCase().includes(search.trim().toLowerCase());
    if (!matches) return false;
    if (filter === 'low') return i.quantity <= i.lowThreshold;
    if (filter === 'ok') return i.quantity > i.lowThreshold;
    return true;
  });

  const handleCreate = async () => {
    if (!newItem.name.trim() || !newItem.unit.trim()) {
      toast.error('Nombre y unidad son requeridos');
      return;
    }
    const toastId = toast.loading('Creando...');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        const created = await res.json();
        setItems(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setIsAdding(false);
        setNewItem({ name: '', quantity: 0, unit: '', lowThreshold: 5 });
        toast.success('Insumo creado', { id: toastId });
      } else {
        toast.error('Error al crear', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const toastId = toast.loading('Eliminando...');
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success('Insumo eliminado', { id: toastId });
      } else {
        toast.error('Error al eliminar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    } finally {
      setDeleteTarget(null);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, unit: item.unit, quantity: item.quantity, lowThreshold: item.lowThreshold });
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    const toastId = toast.loading('Guardando...');
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => (i.id === id ? { ...i, ...editForm } : i)));
        setEditingId(null);
        toast.success('Insumo actualizado', { id: toastId });
      } else {
        toast.error('Error al actualizar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    } finally {
      setSavingId(null);
    }
  };

  const adjustQuantity = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    setSavingId(id);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity: newQty } : i)));
      }
    } finally {
      setSavingId(null);
    }
  };

  const chartData = [...items]
    .sort((a, b) => a.quantity / a.lowThreshold - b.quantity / b.lowThreshold)
    .slice(0, 10)
    .map(i => ({ name: i.name, Cantidad: i.quantity, Umbral: i.lowThreshold, isLow: i.quantity <= i.lowThreshold }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Inventario</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Controla tus insumos en tiempo real.</p>
        </div>
        <button className="btn-primary-action" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Nuevo insumo
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard icon={<Package size={22} />} label="Total insumos" value={items.length} accent="#6366f1" soft="#eef2ff" />
        <KpiCard icon={<PackageCheck size={22} />} label="Con stock saludable" value={okStockItems.length} accent="#10b981" soft="#ecfdf5" />
        <KpiCard icon={<AlertTriangle size={22} />} label="Bajo umbral" value={lowStockItems.length} accent="#ef4444" soft="#fef2f2" warn={lowStockItems.length > 0} />
      </div>

      {/* Low stock alert */}
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 18,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                flexWrap: 'wrap',
              }}
            >
              <AlertTriangle size={22} style={{ color: '#ef4444' }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>Insumos por agotarse</h3>
                <p style={{ fontSize: '0.8125rem', color: '#b91c1c', marginTop: 2 }}>
                  {lowStockItems.map(i => i.name).join(' · ')}
                </p>
              </div>
              <button
                onClick={() => setFilter('low')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  color: '#b91c1c',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Ver lista
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.0625rem', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
            <TrendingDown size={20} style={{ color: '#6366f1' }} /> Insumos más críticos
          </h2>
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Top 10</span>
        </div>
        <div style={{ flex: 1, minHeight: 240 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={120} />
              <Tooltip cursor={{ fill: '#eef2ff' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.1)' }} />
              <Bar dataKey="Cantidad" radius={[0, 6, 6, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isLow ? '#ef4444' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={20} style={{ color: '#6366f1' }} /> Inventario detallado
          </h2>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  width: 220,
                  outline: 'none',
                }}
              />
            </div>
            <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterPill>
            <FilterPill active={filter === 'low'} onClick={() => setFilter('low')} warn>Bajo</FilterPill>
            <FilterPill active={filter === 'ok'} onClick={() => setFilter('ok')}>Saludable</FilterPill>
          </div>
        </div>

        <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidad</th>
                <th>Stock actual</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr style={{ background: '#f8fafc' }}>
                  <td>
                    <input style={{ width: '100%' }} placeholder="Nombre" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                  </td>
                  <td>
                    <input style={{ width: '100%' }} placeholder="Ej. litros" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" style={{ width: 80 }} placeholder="Cant" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })} />
                      <input type="number" style={{ width: 80 }} placeholder="Umbral" value={newItem.lowThreshold} onChange={e => setNewItem({ ...newItem, lowThreshold: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button className="btn-primary-action" onClick={handleCreate}>Guardar</button>
                      <button className="btn-soft-action" onClick={() => setIsAdding(false)}>Cancelar</button>
                    </div>
                  </td>
                </tr>
              )}

              {visible.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
                    Sin resultados
                  </td>
                </tr>
              )}

              {visible.map(item => {
                const isLow = item.quantity <= item.lowThreshold;
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} style={{ background: isLow && !isEditing ? '#fff5f5' : 'transparent' }}>
                    <td style={{ fontWeight: 700 }}>
                      {isEditing ? (
                        <input style={{ width: '100%' }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.name}
                          {isLow && <span style={{ padding: '2px 8px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontSize: '0.625rem', fontWeight: 800 }}>BAJO</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {isEditing ? <input style={{ width: '100%' }} value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} /> : item.unit}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="number" style={{ width: 70 }} value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })} />
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>min</span>
                          <input type="number" style={{ width: 60 }} value={editForm.lowThreshold} onChange={e => setEditForm({ ...editForm, lowThreshold: parseFloat(e.target.value) || 0 })} />
                          <button className="btn-primary-action" onClick={() => saveEdit(item.id)} disabled={savingId === item.id}>Guardar</button>
                          <button className="btn-soft-action" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button className="qty-step" onClick={() => adjustQuantity(item.id, -1)} disabled={savingId === item.id}>−</button>
                            <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: isLow ? '#ef4444' : '#0f172a', minWidth: 40, textAlign: 'center' }}>{item.quantity}</span>
                            <button className="qty-step" onClick={() => adjustQuantity(item.id, 1)} disabled={savingId === item.id}>+</button>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>min {item.lowThreshold}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button className="btn-soft-action" onClick={() => startEdit(item)} title="Editar">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-soft-action" style={{ color: '#ef4444' }} onClick={() => setDeleteTarget(item)} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar insumo"
        message={deleteTarget ? `¿Eliminar "${deleteTarget.name}"? Esto borra el insumo y sus referencias en productos.` : ''}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
  soft,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  soft: string;
  warn?: boolean;
}) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1.25rem' }}>
      <div style={{ background: soft, color: accent, padding: 14, borderRadius: 16 }}>{icon}</div>
      <div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: warn ? '#ef4444' : '#0f172a' }}>{value}</p>
      </div>
    </div>
  );
}

function FilterPill({ children, active, onClick, warn }: { children: React.ReactNode; active: boolean; onClick: () => void; warn?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 0.875rem',
        borderRadius: 10,
        border: '1px solid',
        borderColor: active ? (warn ? '#ef4444' : '#0f172a') : '#e2e8f0',
        background: active ? (warn ? '#ef4444' : '#0f172a') : 'white',
        color: active ? 'white' : '#475569',
        fontWeight: 600,
        fontSize: '0.8125rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
