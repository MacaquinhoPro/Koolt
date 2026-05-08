"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  IceCream2,
  CupSoda,
  CakeSlice,
  ShoppingBag,
  X,
  Check,
  Trash2,
  Plus,
  Minus,
  Edit2,
  CreditCard,
  Banknote,
  ChevronRight,
  Search,
  Sparkles,
  Receipt,
  History,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  includedToppings: number;
  ingredients?: { inventoryItemId: string; quantity: number; inventoryItem?: { name: string; unit: string } | null }[];
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowThreshold: number;
};

type CartItem = {
  uiId: string;
  productId: string;
  productName: string;
  category: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  toppings: string[];
  merengue: boolean;
};

type RecentOrder = {
  id: string;
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  items: { id: string; productName: string; price: number; toppings: string; merengue: boolean }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  YOGURT: 'Yogurt',
  GRANIZADO: 'Granizado',
  BROWNIE: 'Brownie',
  CONO: 'Conos',
  TOPPING: 'Toppings',
  OTRO: 'Otros',
};

const categoryColors: Record<string, string> = {
  YOGURT: '#ec4899',
  GRANIZADO: '#0ea5e9',
  BROWNIE: '#92400e',
  CONO: '#f59e0b',
  TOPPING: '#8b5cf6',
  OTRO: '#64748b',
};

function CategoryIcon({ category, size = 28 }: { category: string; size?: number }) {
  const color = categoryColors[category] || '#64748b';
  if (category === 'YOGURT' || category === 'CONO') return <IceCream2 size={size} style={{ color }} />;
  if (category === 'GRANIZADO') return <CupSoda size={size} style={{ color }} />;
  if (category === 'BROWNIE') return <CakeSlice size={size} style={{ color }} />;
  if (category === 'TOPPING') return <Sparkles size={size} style={{ color }} />;
  return <IceCream2 size={size} style={{ color }} />;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DashboardClient({
  products: initialProducts,
  inventory,
  todayOrdersCount,
  todayRevenue,
  recentOrders: initialRecentOrders,
}: {
  products: Product[];
  inventory: InventoryItem[];
  todayOrdersCount: number;
  todayRevenue: number;
  recentOrders: RecentOrder[];
}) {
  const router = useRouter();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [itemsList, setItemsList] = useState<InventoryItem[]>(inventory);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(initialRecentOrders);
  const [todayCount, setTodayCount] = useState(todayOrdersCount);
  const [todayTotal, setTodayTotal] = useState(todayRevenue);

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', category: 'YOGURT', price: 0, includedToppings: 0 });
  const [formIngredients, setFormIngredients] = useState<{ inventoryItemId: string; quantity: number }[]>([]);

  const [selectedToppings, setSelectedToppings] = useState<Product[]>([]);
  const [hasMerengue, setHasMerengue] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmCancelOrder, setConfirmCancelOrder] = useState<RecentOrder | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setProductsList(initialProducts), [initialProducts]);
  useEffect(() => setItemsList(inventory), [inventory]);
  useEffect(() => setRecentOrders(initialRecentOrders), [initialRecentOrders]);
  useEffect(() => setTodayCount(todayOrdersCount), [todayOrdersCount]);
  useEffect(() => setTodayTotal(todayRevenue), [todayRevenue]);

  const bases = productsList.filter(p => p.category !== 'TOPPING');
  const availableToppings = productsList.filter(p => p.category === 'TOPPING');

  const visibleCategories = useMemo(() => {
    const set = new Set<string>(['ALL']);
    bases.forEach(p => set.add(p.category));
    return Array.from(set);
  }, [bases]);

  const filteredBases = useMemo(() => {
    const s = search.trim().toLowerCase();
    return bases.filter(p => {
      if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
      if (!s) return true;
      return p.name.toLowerCase().includes(s);
    });
  }, [bases, search, activeCategory]);

  const lowStockNames = useMemo(() => {
    return itemsList.filter(i => i.quantity <= i.lowThreshold).map(i => i.name);
  }, [itemsList]);

  const productHasLowStock = (p: Product): boolean => {
    if (!p.ingredients || p.ingredients.length === 0) return false;
    return p.ingredients.some(ing => {
      const inv = itemsList.find(i => i.id === ing.inventoryItemId);
      return inv && inv.quantity <= inv.lowThreshold;
    });
  };

  const openProductForm = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProductForm({ name: p.name, category: p.category, price: p.price, includedToppings: p.includedToppings });
      setFormIngredients((p.ingredients || []).map(i => ({ inventoryItemId: i.inventoryItemId, quantity: i.quantity })));
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', category: 'YOGURT', price: 0, includedToppings: 0 });
      setFormIngredients([]);
    }
    setIsProductFormOpen(true);
  };

  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProductsList(await res.json());
    } catch {
      // ignore
    }
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error('Nombre y precio requeridos');
      return;
    }
    const toastId = toast.loading('Guardando...');
    try {
      const payload = { ...productForm, ingredients: formIngredients };
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Producto ${editingProduct ? 'actualizado' : 'creado'}`, { id: toastId });
        setIsProductFormOpen(false);
        await refreshProducts();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Error al guardar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    }
  };

  const deleteProduct = async (id: string) => {
    const toastId = toast.loading('Eliminando...');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Producto eliminado', { id: toastId });
        setProductsList(prev => prev.filter(p => p.id !== id));
      } else {
        toast.error('Error al eliminar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    }
  };

  const openProductModal = (p: Product) => {
    setActiveProduct(p);
    setSelectedToppings([]);
    setHasMerengue(false);
  };

  const toggleTopping = (t: Product) => {
    setSelectedToppings(prev => (prev.find(x => x.id === t.id) ? prev.filter(x => x.id !== t.id) : [...prev, t]));
  };

  const cartKey = (productId: string, toppings: string[], merengue: boolean) =>
    `${productId}|${[...toppings].sort().join(',')}|${merengue ? 'm' : ''}`;

  const addToCart = () => {
    if (!activeProduct) return;
    const sorted = [...selectedToppings].sort((a, b) => a.name.localeCompare(b.name));
    let extraPrice = 0;
    if (sorted.length > activeProduct.includedToppings) {
      const extras = sorted.slice(activeProduct.includedToppings);
      extraPrice = extras.reduce((acc, t) => acc + t.price, 0);
    }
    const unitPrice = activeProduct.price + extraPrice;
    const toppingsNames = sorted.map(t => t.name);
    const key = cartKey(activeProduct.id, toppingsNames, hasMerengue);

    setCart(prev => {
      const existing = prev.find(c => cartKey(c.productId, c.toppings, c.merengue) === key);
      if (existing) {
        return prev.map(c =>
          cartKey(c.productId, c.toppings, c.merengue) === key ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          uiId: Math.random().toString(36).slice(2),
          productId: activeProduct.id,
          productName: activeProduct.name + (hasMerengue ? ' con Merengue' : ''),
          category: activeProduct.category,
          basePrice: activeProduct.price,
          unitPrice,
          quantity: 1,
          toppings: toppingsNames,
          merengue: hasMerengue,
        },
      ];
    });

    setActiveProduct(null);
    toast.success(`${activeProduct.name} añadido`, { icon: '🍦' });
  };

  const incrementCart = (uiId: string) => {
    setCart(prev => prev.map(c => (c.uiId === uiId ? { ...c, quantity: c.quantity + 1 } : c)));
  };
  const decrementCart = (uiId: string) => {
    setCart(prev =>
      prev.flatMap(c => {
        if (c.uiId !== uiId) return [c];
        if (c.quantity <= 1) return [];
        return [{ ...c, quantity: c.quantity - 1 }];
      }),
    );
  };
  const removeFromCart = (uiId: string) => setCart(prev => prev.filter(c => c.uiId !== uiId));
  const clearCart = () => setCart([]);

  const totalCart = cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);
  const totalUnits = cart.reduce((acc, c) => acc + c.quantity, 0);

  const checkout = async (method: 'NEQUI' | 'EFECTIVO') => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    const toastId = toast.loading('Procesando pedido...');
    try {
      const expanded = cart.flatMap(c =>
        Array.from({ length: c.quantity }, () => ({
          productId: c.productId,
          productName: c.productName,
          price: c.unitPrice,
          toppings: c.toppings,
          merengue: c.merengue,
        })),
      );

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: expanded, paymentMethod: method, totalPrice: totalCart }),
      });
      if (res.ok) {
        toast.success(`Pedido confirmado · $${totalCart.toLocaleString('es-CO')}`, { id: toastId, icon: '✅' });
        setCart([]);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Error al confirmar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const toastId = toast.loading('Cancelando pedido...');
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Pedido cancelado · inventario restaurado', { id: toastId });
        setRecentOrders(prev => prev.filter(o => o.id !== orderId));
        router.refresh();
      } else {
        toast.error('Error al cancelar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    }
  };

  // Keyboard shortcut: Enter (when nothing focused) -> Nequi
  const checkoutRef = useRef(checkout);
  checkoutRef.current = checkout;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        setActiveProduct(null);
        setIsProductFormOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 80px)' }}>
      {/* Header bar with KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Punto de venta</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Crea pedidos y gestiona el menú · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <KPI label="Pedidos hoy" value={todayCount.toString()} icon={<Receipt size={18} />} />
          <KPI label="Ventas hoy" value={`$${todayTotal.toLocaleString('es-CO')}`} icon={<TrendingUp size={18} />} accent />
          <button
            onClick={() => setShowRecent(true)}
            style={btnSoft}
            title="Pedidos recientes"
          >
            <History size={16} /> Recientes
          </button>
          <button
            onClick={() => setIsEditingMode(v => !v)}
            style={isEditingMode ? btnPrimary : btnSoft}
          >
            <Edit2 size={16} />
            {isEditingMode ? 'Listo' : 'Gestionar'}
          </button>
        </div>
      </div>

      {/* Low stock banner */}
      {lowStockNames.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 16,
            color: '#9a3412',
          }}
        >
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Bajo stock:</span>
          <span style={{ fontSize: '0.875rem' }}>{lowStockNames.slice(0, 6).join(' · ')}{lowStockNames.length > 6 ? ` · +${lowStockNames.length - 6} más` : ''}</span>
        </div>
      )}

      <div className="dashboard-layout" style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Left Panel - Products */}
        <div style={{ flex: 2.2, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* Search + categories */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  fontSize: '0.9375rem',
                  outline: 'none',
                  background: 'white',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {visibleCategories.map(c => {
                const active = activeCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    style={{
                      padding: '0.5rem 0.875rem',
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: active ? '#0f172a' : '#e2e8f0',
                      background: active ? '#0f172a' : 'white',
                      color: active ? 'white' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    {c === 'ALL' ? 'Todos' : CATEGORY_LABELS[c] || c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products grid */}
          <div style={{ overflowY: 'auto', paddingRight: 4, flex: 1, minHeight: 0 }}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}
            >
              <AnimatePresence>
                {filteredBases.map(p => {
                  const lowStock = productHasLowStock(p);
                  return (
                    <motion.div
                      key={p.id}
                      variants={itemVariants}
                      layout
                      whileHover={!isEditingMode ? { y: -3 } : {}}
                      whileTap={!isEditingMode ? { scale: 0.98 } : {}}
                      onClick={() => !isEditingMode && openProductModal(p)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.625rem',
                        cursor: isEditingMode ? 'default' : 'pointer',
                        position: 'relative',
                        padding: '1.5rem 1rem',
                        background: 'white',
                        borderRadius: 22,
                        border: isEditingMode ? '2px dashed #e2e8f0' : '1px solid #e2e8f0',
                        boxShadow: isEditingMode ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.875rem',
                          borderRadius: 18,
                          background: `${categoryColors[p.category]}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CategoryIcon category={p.category} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{p.name}</h3>
                        <p style={{ color: '#ec4899', fontWeight: 700, fontSize: '1.0625rem' }}>${p.price.toLocaleString('es-CO')}</p>
                        {p.includedToppings > 0 && (
                          <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                            +{p.includedToppings} topping{p.includedToppings > 1 ? 's' : ''} gratis
                          </p>
                        )}
                      </div>

                      {lowStock && !isEditingMode && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                          }}
                        >
                          BAJO STOCK
                        </span>
                      )}

                      {isEditingMode && (
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              openProductForm(p);
                            }}
                            style={iconBtn}
                          >
                            <Edit2 size={14} style={{ color: '#64748b' }} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setConfirmDelete({ id: p.id, name: p.name });
                            }}
                            style={{ ...iconBtn, background: '#fef2f2', borderColor: '#fecaca' }}
                          >
                            <Trash2 size={14} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isEditingMode && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openProductForm()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 160,
                    cursor: 'pointer',
                    borderRadius: 22,
                    background: '#f8fafc',
                  }}
                >
                  <Plus size={28} style={{ color: '#94a3b8' }} />
                  <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem', marginTop: 6 }}>Añadir Base</span>
                </motion.div>
              )}

              {!isEditingMode && filteredBases.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 2rem', color: '#94a3b8' }}>
                  <Search size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <p style={{ fontWeight: 500 }}>Sin coincidencias</p>
                </div>
              )}
            </motion.div>

            {isEditingMode && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>Toppings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
                  {availableToppings.map(p => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0.875rem',
                        background: 'white',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                        <p style={{ color: '#ec4899', fontWeight: 700, fontSize: '0.8125rem' }}>+${p.price.toLocaleString('es-CO')}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openProductForm(p)} style={iconBtn}>
                          <Edit2 size={12} style={{ color: '#64748b' }} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
                          style={{ ...iconBtn, background: '#fef2f2', borderColor: '#fecaca' }}
                        >
                          <Trash2 size={12} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', category: 'TOPPING', price: 0, includedToppings: 0 });
                      setFormIngredients([]);
                      setIsProductFormOpen(true);
                    }}
                    style={{
                      border: '2px dashed #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      padding: '0.75rem',
                      borderRadius: 14,
                      background: '#f8fafc',
                    }}
                  >
                    <Plus size={16} style={{ color: '#94a3b8' }} />
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>Añadir</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div
          style={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            borderRadius: 28,
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 110px)',
          }}
          className="cart-panel"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Pedido actual</h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'} en el carrito
              </p>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ ...iconBtn, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: 4 }} title="Vaciar carrito">
                <Trash2 size={14} style={{ color: '#ef4444' }} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Vaciar</span>
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingRight: 4 }}>
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ color: '#94a3b8', textAlign: 'center', marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
                >
                  <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '50%' }}>
                    <ShoppingBag size={28} style={{ opacity: 0.4 }} />
                  </div>
                  <p style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Carrito vacío</p>
                  <p style={{ fontSize: '0.75rem', maxWidth: 220 }}>Selecciona productos del menú para crear un pedido.</p>
                </motion.div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.uiId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{ padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 18, border: '1px solid #f1f5f9' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a', wordBreak: 'break-word' }}>{item.productName}</h4>
                        {item.toppings.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {item.toppings.map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.625rem',
                                  background: 'white',
                                  color: '#475569',
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  fontWeight: 500,
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.uiId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <X size={14} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #e2e8f0' }}>
                        <button onClick={() => decrementCart(item.uiId)} style={qtyBtn}>
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>{item.quantity}</span>
                        <button onClick={() => incrementCart(item.uiId)} style={qtyBtn}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>${(item.unitPrice * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9375rem', color: '#64748b', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a' }}>${totalCart.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => checkout('NEQUI')} disabled={cart.length === 0 || submitting} style={payBtn(cart.length === 0 || submitting, '#0f172a', 'white')}>
                <CreditCard size={16} />
                <span>Nequi</span>
              </button>
              <button onClick={() => checkout('EFECTIVO')} disabled={cart.length === 0 || submitting} style={payBtn(cart.length === 0 || submitting, '#10b981', 'white')}>
                <Banknote size={16} />
                <span>Efectivo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {activeProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.4)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: 16,
            }}
            onClick={() => setActiveProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 600, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: 28, padding: '1.75rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', borderRadius: 16, background: `${categoryColors[activeProduct.category]}15` }}>
                    <CategoryIcon category={activeProduct.category} size={26} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{activeProduct.name}</h2>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: 2 }}>
                      Base ${activeProduct.price.toLocaleString('es-CO')} · {activeProduct.includedToppings} topping{activeProduct.includedToppings === 1 ? '' : 's'} sin costo
                    </p>
                  </div>
                </div>
                <button style={{ background: '#f1f5f9', borderRadius: 12, padding: '0.5rem', border: 'none', cursor: 'pointer' }} onClick={() => setActiveProduct(null)}>
                  <X size={18} style={{ color: '#64748b' }} />
                </button>
              </div>

              {activeProduct.category === 'GRANIZADO' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '0.875rem 1rem',
                    border: `2px solid ${hasMerengue ? '#ec4899' : '#e2e8f0'}`,
                    borderRadius: 14,
                    background: hasMerengue ? '#fdf2f8' : 'transparent',
                    margin: '1.25rem 0',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${hasMerengue ? '#ec4899' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: hasMerengue ? '#ec4899' : 'transparent',
                    }}
                  >
                    {hasMerengue && <Check size={12} color="white" />}
                  </div>
                  <input type="checkbox" checked={hasMerengue} onChange={e => setHasMerengue(e.target.checked)} style={{ display: 'none' }} />
                  <span>Añadir Merengue</span>
                </label>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1.25rem', marginBottom: '0.625rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Toppings</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                  {selectedToppings.length}/{activeProduct.includedToppings} gratis
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {availableToppings.map(t => {
                  const idx = selectedToppings.findIndex(x => x.id === t.id);
                  const isSelected = idx >= 0;
                  const isFree = isSelected && idx < activeProduct.includedToppings;
                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleTopping(t)}
                      style={{
                        padding: '0.75rem',
                        border: `2px solid ${isSelected ? '#ec4899' : '#e2e8f0'}`,
                        borderRadius: 14,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#fdf2f8' : 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      {isFree && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: '#10b981',
                            color: 'white',
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 999,
                          }}
                        >
                          GRATIS
                        </span>
                      )}
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{t.name}</span>
                      <span style={{ fontSize: '0.6875rem', color: isFree ? '#10b981' : '#ec4899', fontWeight: 700 }}>
                        {isFree ? 'incluido' : `+$${t.price.toLocaleString('es-CO')}`}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  background: '#f8fafc',
                  borderRadius: 14,
                  marginBottom: '0.875rem',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>Total a añadir</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  $
                  {(
                    activeProduct.price +
                    selectedToppings.slice(activeProduct.includedToppings).reduce((acc, t) => acc + t.price, 0)
                  ).toLocaleString('es-CO')}
                </span>
              </div>

              <button
                onClick={addToCart}
                style={{
                  width: '100%',
                  height: '3.25rem',
                  background: '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 8px 18px rgba(236,72,153,0.25)',
                }}
              >
                Añadir al pedido <ChevronRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {isProductFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.4)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110,
              padding: 16,
            }}
            onClick={() => setIsProductFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 460, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: 24, padding: '1.75rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
                <button style={{ background: '#f1f5f9', borderRadius: 10, padding: '0.375rem', border: 'none', cursor: 'pointer' }} onClick={() => setIsProductFormOpen(false)}>
                  <X size={18} style={{ color: '#64748b' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Nombre">
                  <input
                    type="text"
                    value={productForm.name || ''}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ej. Yogurt Grande"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Categoría">
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} style={inputStyle}>
                    <option value="YOGURT">Yogurt Helado</option>
                    <option value="GRANIZADO">Granizado</option>
                    <option value="BROWNIE">Brownie</option>
                    <option value="CONO">Cono / Waffle</option>
                    <option value="TOPPING">Topping</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </Field>

                <Field label="Precio ($)">
                  <input
                    type="number"
                    value={productForm.price || ''}
                    onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    style={inputStyle}
                  />
                </Field>

                {productForm.category !== 'TOPPING' && (
                  <Field label="Toppings incluidos sin costo">
                    <input
                      type="number"
                      min="0"
                      value={productForm.includedToppings || 0}
                      onChange={e => setProductForm({ ...productForm, includedToppings: parseInt(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </Field>
                )}

                {itemsList.length > 0 && (
                  <div>
                    <label style={fieldLabel}>Insumos consumidos por unidad</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                      {itemsList.map(item => {
                        const ingredient = formIngredients.find(i => i.inventoryItemId === item.id);
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#f8fafc', borderRadius: 10 }}>
                            <input
                              type="checkbox"
                              checked={!!ingredient}
                              onChange={e => {
                                const newIngredients = formIngredients.filter(i => i.inventoryItemId !== item.id);
                                if (e.target.checked) newIngredients.push({ inventoryItemId: item.id, quantity: 1 });
                                setFormIngredients(newIngredients);
                              }}
                              style={{ width: 16, height: 16 }}
                            />
                            <span style={{ flex: 1, fontSize: '0.875rem' }}>{item.name}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Cant"
                              value={ingredient?.quantity ?? ''}
                              onChange={e => {
                                const qty = parseFloat(e.target.value) || 0;
                                const current = formIngredients.filter(i => i.inventoryItemId !== item.id);
                                if (qty > 0) setFormIngredients([...current, { inventoryItemId: item.id, quantity: qty }]);
                                else setFormIngredients(current);
                              }}
                              style={{ width: 70, padding: 6, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8125rem' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 50 }}>{item.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={saveProduct}
                  style={{
                    marginTop: 6,
                    width: '100%',
                    height: 46,
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                  }}
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent orders panel */}
      <AnimatePresence>
        {showRecent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 120,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setShowRecent(false)}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 420, maxWidth: '95%', height: '100%', background: 'white', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>Pedidos recientes</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Últimos {recentOrders.length}</p>
                </div>
                <button onClick={() => setShowRecent(false)} style={iconBtn}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentOrders.length === 0 && (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem 1rem' }}>
                    <Receipt size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <p>Aún no hay pedidos</p>
                  </div>
                )}
                {recentOrders.map(o => {
                  let parsedToppings: string[][] = [];
                  parsedToppings = o.items.map(i => {
                    try {
                      return JSON.parse(i.toppings || '[]');
                    } catch {
                      return [];
                    }
                  });
                  return (
                    <div key={o.id} style={{ background: '#f8fafc', borderRadius: 16, padding: '0.875rem 1rem', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{formatTime(o.createdAt)} · {o.paymentMethod}</p>
                          <p style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>${o.totalPrice.toLocaleString('es-CO')}</p>
                        </div>
                        <button
                          onClick={() => setConfirmCancelOrder(o)}
                          style={{ ...iconBtn, background: '#fef2f2', borderColor: '#fecaca' }}
                          title="Cancelar pedido y restaurar inventario"
                        >
                          <Trash2 size={14} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {o.items.map((it, idx) => (
                          <div key={it.id} style={{ fontSize: '0.8125rem', color: '#475569' }}>
                            • {it.productName}
                            {parsedToppings[idx] && parsedToppings[idx].length > 0 && (
                              <span style={{ color: '#94a3b8' }}> ({parsedToppings[idx].join(', ')})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Eliminar producto"
        message={confirmDelete ? `¿Eliminar "${confirmDelete.name}"? No se podrá recuperar.` : ''}
        confirmLabel="Eliminar"
        onConfirm={() => confirmDelete && deleteProduct(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        isOpen={!!confirmCancelOrder}
        title="Cancelar pedido"
        message={
          confirmCancelOrder
            ? `Se eliminará el pedido y se restaurará el inventario consumido. ¿Continuar?`
            : ''
        }
        confirmLabel="Sí, cancelar"
        onConfirm={() => confirmCancelOrder && cancelOrder(confirmCancelOrder.id)}
        onCancel={() => setConfirmCancelOrder(null)}
      />
    </div>
  );
}

function KPI({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0.625rem 0.875rem',
        background: accent ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'white',
        color: accent ? 'white' : '#0f172a',
        borderRadius: 14,
        border: '1px solid',
        borderColor: accent ? 'transparent' : '#e2e8f0',
        boxShadow: accent ? '0 6px 18px rgba(15,23,42,0.18)' : '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ opacity: accent ? 0.85 : 0.7 }}>{icon}</div>
      <div>
        <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>{label}</p>
        <p style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 0.875rem',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  fontSize: '0.9375rem',
  outline: 'none',
  background: 'white',
};

const iconBtn: React.CSSProperties = {
  padding: '0.375rem',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const qtyBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#475569',
};

const btnSoft: React.CSSProperties = {
  padding: '0.625rem 1rem',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: 'white',
  color: '#475569',
  fontWeight: 600,
  fontSize: '0.8125rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const btnPrimary: React.CSSProperties = {
  padding: '0.625rem 1rem',
  borderRadius: 12,
  border: 'none',
  background: '#0f172a',
  color: 'white',
  fontWeight: 600,
  fontSize: '0.8125rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

function payBtn(disabled: boolean, bg: string, fg: string): React.CSSProperties {
  return {
    flex: 1,
    height: 52,
    background: disabled ? '#f1f5f9' : bg,
    color: disabled ? '#94a3b8' : fg,
    border: 'none',
    borderRadius: 14,
    fontWeight: 700,
    fontSize: '0.9375rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.15s',
  };
}
