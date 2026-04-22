"use client";

import { useState, useEffect } from 'react';
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
  Edit2, 
  Settings2, 
  ShoppingCart, 
  CreditCard, 
  Banknote,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  includedToppings: number;
};

type CartItem = {
  uiId: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  toppings: string[];
  merengue: boolean;
};

export default function DashboardClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    setProductsList(products);
  }, [products]);

  // Product Management States
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', category: 'YOGURT', price: 0, includedToppings: 0 });

  // Modal states
  const [selectedToppings, setSelectedToppings] = useState<Product[]>([]);
  const [hasMerengue, setHasMerengue] = useState(false);

  // Grouped products
  const bases = productsList.filter(p => p.category !== 'TOPPING');
  const availableToppings = productsList.filter(p => p.category === 'TOPPING');

  const openProductForm = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProductForm({ name: p.name, category: p.category, price: p.price, includedToppings: p.includedToppings });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', category: 'YOGURT', price: 0, includedToppings: 0 });
    }
    setIsProductFormOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error('Nombre y precio requeridos'); return;
    }
    const toastId = toast.loading('Guardando...');
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productForm)
      });
      if (res.ok) {
        toast.success(`Producto ${editingProduct ? 'actualizado' : 'creado'}`, { id: toastId });
        setIsProductFormOpen(false);
        router.refresh();
      } else {
        toast.error('Error al guardar', { id: toastId });
      }
    } catch {
      toast.error('Error de red', { id: toastId });
    }
  };

  const deleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar producto?')) return;
    const toastId = toast.loading('Eliminando...');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Producto eliminado', { id: toastId });
        router.refresh();
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
    if (selectedToppings.find(x => x.id === t.id)) {
      setSelectedToppings(selectedToppings.filter(x => x.id !== t.id));
    } else {
      setSelectedToppings([...selectedToppings, t]);
    }
  };

  const addToCart = () => {
    if (!activeProduct) return;
    
    let extraPrice = 0;
    if (selectedToppings.length > activeProduct.includedToppings) {
      const extraItems = selectedToppings.slice(activeProduct.includedToppings);
      extraPrice = extraItems.reduce((acc, curr) => acc + curr.price, 0);
    }

    const newItem: CartItem = {
      uiId: Math.random().toString(36).substring(7),
      productId: activeProduct.id,
      productName: activeProduct.name + (hasMerengue ? ' con Merengue' : ''),
      category: activeProduct.category,
      price: activeProduct.price + extraPrice,
      toppings: selectedToppings.map(t => t.name),
      merengue: hasMerengue
    };

    setCart([...cart, newItem]);
    setActiveProduct(null);
    toast.success(`${newItem.productName} añadido`, { icon: '✨' });
  };

  const removeFromCart = (uiId: string) => {
    setCart(cart.filter(c => c.uiId !== uiId));
  };

  const totalCart = cart.reduce((acc, curr) => acc + curr.price, 0);

  const checkout = async (method: "NEQUI" | "EFECTIVO") => {
    if (cart.length === 0) return;
    const toastId = toast.loading('Procesando pedido...');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          paymentMethod: method,
          totalPrice: totalCart
        })
      });
      if (res.ok) {
        toast.success(`Pedido creado correctamente`, { id: toastId });
        setCart([]);
        router.refresh();
      } else {
        toast.error("Error al confirmar el pedido.", { id: toastId });
      }
    } catch {
      toast.error("Error de red.", { id: toastId });
    }
  };

  const getCategoryIcon = (category: string) => {
    const style = { strokeWidth: 1.5 };
    switch (category) {
      case 'YOGURT': return <IceCream2 size={32} className="text-primary" {...style} />;
      case 'GRANIZADO': return <CupSoda size={32} style={{ color: '#0ea5e9' }} {...style} />;
      case 'BROWNIE': return <CakeSlice size={32} style={{ color: '#92400e' }} {...style} />;
      case 'CONO': return <IceCream2 size={32} style={{ color: '#f59e0b' }} {...style} />;
      default: return <Sparkles size={32} className="text-primary" {...style} />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Product Selection List */}
      <div className="dashboard-panel-left" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag className="text-primary" /> Productos Disponibles
          </h2>
          <button 
            className={`btn ${isEditingMode ? 'btn-danger' : 'btn-secondary'}`} 
            onClick={() => setIsEditingMode(!isEditingMode)}
          >
            <Settings2 size={18} /> {isEditingMode ? 'Cerrar Gestión' : 'Gestionar'}
          </button>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid-container"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}
        >
          <AnimatePresence>
            {bases.map((p) => (
              <motion.div 
                key={p.id}
                variants={itemVariants}
                layout
                whileHover={!isEditingMode ? { y: -8, boxShadow: 'var(--shadow-xl)' } : {}}
                whileTap={!isEditingMode ? { scale: 0.98 } : {}}
                onClick={() => !isEditingMode && openProductModal(p)}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '1rem',
                  cursor: isEditingMode ? 'default' : 'pointer',
                  position: 'relative',
                  padding: '2rem 1.5rem',
                  border: isEditingMode ? '1px dashed var(--border-color)' : '1px solid var(--border-color)'
                }}
              >
                <div style={{ 
                  padding: '1.25rem', 
                  background: 'var(--bg-color)', 
                  borderRadius: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getCategoryIcon(p.category)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem' }}>{p.name}</h3>
                  <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.25rem' }}>
                    ${p.price.toLocaleString('es-CO')}
                  </p>
                </div>

                {isEditingMode && (
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); openProductForm(p); }} className="btn" style={{ padding: '0.5rem', background: 'var(--bg-color)' }}>
                      <Edit2 size={16} className="text-primary" />
                    </button>
                    <button onClick={(e) => deleteProduct(p.id, e)} className="btn" style={{ padding: '0.5rem', background: 'var(--danger-soft)' }}>
                      <Trash2 size={16} className="text-danger" />
                    </button>
                  </div>
                )}
                
                {!isEditingMode && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: '0.5rem', 
                    borderRadius: 'var(--radius-lg) 0 var(--radius-lg) 0',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }} className="card-add-indicator">
                    <Plus size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isEditingMode && (
             <motion.div 
               variants={itemVariants}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="card"
               onClick={() => openProductForm()}
               style={{ border: '2px dashed var(--primary)', background: 'var(--primary-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', cursor: 'pointer' }}
             >
               <Plus size={40} className="text-primary" />
               <h3 className="text-primary">Añadir Base</h3>
             </motion.div>
          )}
        </motion.div>

        {isEditingMode && (
          <div style={{ marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles className="text-primary" /> Toppings Disponibles
            </h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid-container"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
            >
              {availableToppings.map((p) => (
                <motion.div key={p.id} variants={itemVariants} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: '600' }}>{p.name}</h4>
                    <p style={{ color: 'var(--primary)', fontWeight: '700' }}>${p.price.toLocaleString('es-CO')}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); openProductForm(p); }} className="btn" style={{ padding: '0.4rem' }}>
                      <Edit2 size={14} className="text-primary" />
                    </button>
                    <button onClick={(e) => deleteProduct(p.id, e)} className="btn" style={{ padding: '0.4rem' }}>
                      <Trash2 size={14} className="text-danger" />
                    </button>
                  </div>
                </motion.div>
              ))}
              <motion.div 
                 variants={itemVariants}
                 className="card"
                 onClick={() => {
                   setEditingProduct(null);
                   setProductForm({ name: '', category: 'TOPPING', price: 0, includedToppings: 0 });
                   setIsProductFormOpen(true);
                 }}
                 style={{ border: '1px dashed var(--primary)', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem' }}
               >
                 <Plus size={18} className="text-primary" />
                 <span className="text-primary" style={{ fontWeight: '600' }}>Añadir Topping</span>
               </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Cart Panel - Glassmorphism */}
      <div className="card glass-card dashboard-panel-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingCart className="text-primary" /> Pedido
          </h2>
          <span style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '1rem', 
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            {cart.length} ítems
          </span>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
              >
                <div style={{ padding: '2rem', background: 'var(--primary-soft)', borderRadius: '50%' }}>
                  <ShoppingBag size={48} className="text-primary" style={{ opacity: 0.5 }} />
                </div>
                <p style={{ fontWeight: '500' }}>El carrito está vacío</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div 
                  key={item.uiId} 
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className="card"
                  style={{ padding: '1.25rem', background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.productName}</h4>
                    <button onClick={() => removeFromCart(item.uiId)} className="btn btn-danger" style={{ padding: '0.25rem', background: 'transparent' }}>
                      <X size={18} />
                    </button>
                  </div>
                  {item.toppings.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                      {item.toppings.map((t, idx) => (
                        <span key={idx} style={{ 
                          fontSize: '0.75rem', 
                          background: 'var(--bg-color)', 
                          color: 'var(--text-secondary)', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '1rem',
                          border: '1px solid var(--border-color)'
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.125rem' }}>${item.price.toLocaleString('es-CO')}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total a pagar:</span>
            <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)' }}>${totalCart.toLocaleString('es-CO')}</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ flex: 1, height: '4rem' }} onClick={() => checkout('NEQUI')} disabled={cart.length === 0}>
              <CreditCard size={20} />
              <span>Nequi</span>
            </button>
            <button className="btn btn-success" style={{ flex: 1, height: '4rem' }} onClick={() => checkout('EFECTIVO')} disabled={cart.length === 0}>
              <Banknote size={20} />
              <span>Efectivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      <AnimatePresence>
        {activeProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={() => setActiveProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="card glass-card" 
              style={{ width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', border: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{activeProduct.name}</h2>
                <button className="btn" style={{ background: 'var(--bg-color)', borderRadius: '50%', padding: '0.5rem' }} onClick={() => setActiveProduct(null)}>
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ 
                background: 'var(--primary-soft)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '2rem', 
                color: 'var(--primary)', 
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <Info size={20} style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <p style={{ fontWeight: '600', fontSize: '0.9375rem' }}>
                  Este tamaño incluye {activeProduct.includedToppings} {activeProduct.includedToppings === 1 ? 'topping' : 'toppings'}. 
                  Los adicionales se sumarán automáticamente al total.
                </p>
              </div>

              {activeProduct.category === 'GRANIZADO' && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    cursor: 'pointer', 
                    fontWeight: '700', 
                    padding: '1.25rem', 
                    border: '2px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: hasMerengue ? 'var(--primary-soft)' : 'white',
                    borderColor: hasMerengue ? 'var(--primary)' : 'var(--border-color)',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '0.4rem',
                      border: '2px solid var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: hasMerengue ? 'var(--primary)' : 'transparent'
                    }}>
                      {hasMerengue && <Check size={16} color="white" />}
                    </div>
                    <input type="checkbox" checked={hasMerengue} onChange={e => setHasMerengue(e.target.checked)} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.125rem' }}>¿Añadir Merengue?</span>
                  </label>
                </div>
              )}

              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} className="text-primary" /> Elige tus Toppings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                {availableToppings.map(t => {
                  const isSelected = selectedToppings.find(x => x.id === t.id);
                  return (
                    <motion.div 
                      key={t.id} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleTopping(t)}
                      style={{
                        padding: '1rem',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--primary-soft)' : 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>{t.name}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>+${t.price}</span>
                      <div style={{ 
                        marginTop: '0.5rem', 
                        width: '1.25rem', 
                        height: '1.25rem', 
                        borderRadius: '50%', 
                        border: '1px solid var(--border-color)', 
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && <Check size={12} color="white" />}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div style={{ position: 'sticky', bottom: 0, padding: '1rem 0 0 0', background: 'transparent' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '4rem', fontSize: '1.125rem' }} 
                  onClick={addToCart}
                >
                  Confirmar y Añadir
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Form Modal */}
      <AnimatePresence>
        {isProductFormOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="card" style={{ width: '450px', maxWidth: '95%', padding: '2.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{editingProduct ? 'Editar' : 'Añadir'} Producto</h2>
                <button className="btn" style={{ background: 'var(--bg-color)', borderRadius: '50%', padding: '0.5rem' }} onClick={() => setIsProductFormOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nombre del Producto</label>
                  <input 
                    type="text" placeholder="Ej. Yogurt Grande" style={{ width: '100%' }}
                    value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} 
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Categoría</label>
                  <select 
                    value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="YOGURT">Yogurt Helado</option>
                    <option value="GRANIZADO">Granizado</option>
                    <option value="BROWNIE">Brownie</option>
                    <option value="CONO">Cono / Waffle</option>
                    <option value="TOPPING">Topping / Adicional</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Precio Unitario ($)</label>
                  <input 
                    type="number" style={{ width: '100%' }}
                    value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})} 
                  />
                </div>

                {productForm.category !== 'TOPPING' && (
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Toppings Gratuitos Incluidos</label>
                    <input 
                      type="number" min="0" style={{ width: '100%' }}
                      value={productForm.includedToppings || 0} onChange={e => setProductForm({...productForm, includedToppings: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                )}
                
                <button className="btn btn-primary" onClick={saveProduct} style={{ marginTop: '1rem', width: '100%', height: '3.5rem' }}>
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
