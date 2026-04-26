"use client";

import { useState } from 'react';
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
  CreditCard, 
  Banknote,
  ChevronRight
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

const categoryColors: Record<string, string> = {
  YOGURT: '#ec4899',
  GRANIZADO: '#0ea5e9',
  BROWNIE: '#92400e',
  CONO: '#f59e0b',
  TOPPING: '#8b5cf6'
};

export default function DashboardClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [productsList] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', category: 'YOGURT', price: 0, includedToppings: 0 });

  const [selectedToppings, setSelectedToppings] = useState<Product[]>([]);
  const [hasMerengue, setHasMerengue] = useState(false);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Left Panel - Products */}
      <div style={{ flex: 2.2, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#18181b' }}>Menú</h2>
          <button 
            onClick={() => setIsEditingMode(!isEditingMode)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '12px',
              border: 'none',
              background: isEditingMode ? '#18181b' : '#f4f4f5',
              color: isEditingMode ? 'white' : '#52525b',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isEditingMode ? 'Listo' : 'Gestionar'}
          </button>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
        >
          <AnimatePresence>
            {bases.map((p) => (
              <motion.div 
                key={p.id}
                variants={itemVariants}
                layout
                whileHover={!isEditingMode ? { y: -4, scale: 1.01 } : {}}
                whileTap={!isEditingMode ? { scale: 0.99 } : {}}
                onClick={() => !isEditingMode && openProductModal(p)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  cursor: isEditingMode ? 'default' : 'pointer',
                  position: 'relative',
                  padding: '1.75rem 1.25rem',
                  background: 'white',
                  borderRadius: '24px',
                  border: isEditingMode ? '2px dashed #e4e4e7' : '1px solid #f4f4f5',
                  boxShadow: isEditingMode ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '20px',
                  background: `${categoryColors[p.category]}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {p.category === 'YOGURT' && <IceCream2 size={28} style={{ color: categoryColors[p.category] }} />}
                  {p.category === 'GRANIZADO' && <CupSoda size={28} style={{ color: categoryColors[p.category] }} />}
                  {p.category === 'BROWNIE' && <CakeSlice size={28} style={{ color: categoryColors[p.category] }} />}
                  {p.category === 'CONO' && <IceCream2 size={28} style={{ color: categoryColors[p.category] }} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#18181b', marginBottom: '0.125rem' }}>{p.name}</h3>
                  <p style={{ color: '#ec4899', fontWeight: 700, fontSize: '1.125rem' }}>
                    ${p.price.toLocaleString('es-CO')}
                  </p>
                </div>

                {isEditingMode && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.375rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); openProductForm(p); }} style={{ padding: '0.375rem', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px', cursor: 'pointer' }}>
                      <Edit2 size={14} style={{ color: '#a1a1aa' }} />
                    </button>
                    <button onClick={(e) => deleteProduct(p.id, e)} style={{ padding: '0.375rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}>
                      <Trash2 size={14} style={{ color: '#ef4444' }} />
                    </button>
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
               onClick={() => openProductForm()}
               style={{ border: '2px dashed #d4d4d8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px', cursor: 'pointer', borderRadius: '24px', background: '#fafafa' }}
             >
               <Plus size={32} style={{ color: '#a1a1aa' }} />
               <span style={{ color: '#71717a', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem' }}>Añadir Base</span>
             </motion.div>
          )}
        </motion.div>

        {isEditingMode && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#52525b', marginBottom: '1rem' }}>Toppings</h3>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}
            >
              {availableToppings.map((p) => (
                <motion.div key={p.id} variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'white', borderRadius: '16px', border: '1px solid #f4f4f5' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#18181b' }}>{p.name}</h4>
                    <p style={{ color: '#ec4899', fontWeight: 700, fontSize: '0.875rem' }}>+${p.price.toLocaleString('es-CO')}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); openProductForm(p); }} style={{ padding: '0.25rem', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer' }}>
                      <Edit2 size={12} style={{ color: '#a1a1aa' }} />
                    </button>
                    <button onClick={(e) => deleteProduct(p.id, e)} style={{ padding: '0.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>
                      <Trash2 size={12} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </motion.div>
              ))}
              <motion.div 
                 variants={itemVariants}
                 onClick={() => {
                   setEditingProduct(null);
                   setProductForm({ name: '', category: 'TOPPING', price: 0, includedToppings: 0 });
                   setIsProductFormOpen(true);
                 }}
                 style={{ border: '2px dashed #e4e4e7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.875rem', borderRadius: '16px', background: '#fafafa' }}
               >
                 <Plus size={16} style={{ color: '#a1a1aa' }} />
                 <span style={{ color: '#71717a', fontWeight: 600, fontSize: '0.875rem' }}>Añadir</span>
               </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Right Panel - Cart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: '32px', padding: '1.75rem', border: '1px solid #f4f4f5', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b' }}>Pedido</h2>
          <span style={{ background: '#18181b', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: '#a1a1aa', textAlign: 'center', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
              >
                <div style={{ padding: '1.5rem', background: '#fafafa', borderRadius: '50%' }}>
                  <ShoppingBag size={32} style={{ opacity: 0.4 }} />
                </div>
                <p style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Carrito vacío</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div 
                  key={item.uiId} 
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  style={{ padding: '1rem 1.25rem', background: '#fafafa', borderRadius: '20px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#18181b' }}>{item.productName}</h4>
                    <button onClick={() => removeFromCart(item.uiId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0' }}>
                      <X size={16} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                  {item.toppings.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.375rem' }}>
                      {item.toppings.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '0.6875rem', background: '#f4f4f5', color: '#71717a', padding: '0.125rem 0.5rem', borderRadius: '8px', fontWeight: 500 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.625rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>Subtotal</span>
                    <span style={{ fontWeight: 700, color: '#18181b', fontSize: '1rem' }}>${item.price.toLocaleString('es-CO')}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #f4f4f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1rem', color: '#71717a', fontWeight: 500 }}>Total:</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>${totalCart.toLocaleString('es-CO')}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => checkout('NEQUI')} 
              disabled={cart.length === 0}
              style={{ 
                flex: 1, 
                height: '3.5rem',
                background: cart.length === 0 ? '#f4f4f5' : '#18181b', 
                color: cart.length === 0 ? '#a1a1aa' : 'white', 
                border: 'none', 
                borderRadius: '16px', 
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <CreditCard size={18} />
              <span>Nequi</span>
            </button>
            <button 
              onClick={() => checkout('EFECTIVO')} 
              disabled={cart.length === 0}
              style={{ 
                flex: 1, 
                height: '3.5rem',
                background: cart.length === 0 ? '#f4f4f5' : '#10b981', 
                color: cart.length === 0 ? '#a1a1aa' : 'white', 
                border: 'none', 
                borderRadius: '16px', 
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Banknote size={18} />
              <span>Efectivo</span>
            </button>
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
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={() => setActiveProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '560px', maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto', background: 'white', borderRadius: '28px', padding: '2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>{activeProduct.name}</h2>
                <button style={{ background: '#f4f4f5', borderRadius: '12px', padding: '0.5rem', border: 'none', cursor: 'pointer' }} onClick={() => setActiveProduct(null)}>
                  <X size={20} style={{ color: '#71717a' }} />
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '1.75rem' }}>
                Incluye {activeProduct.includedToppings} {activeProduct.includedToppings === 1 ? 'topping' : 'toppings'} sin costo adicional
              </p>

              {activeProduct.category === 'GRANIZADO' && (
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  padding: '1rem 1.25rem', 
                  border: `2px solid ${hasMerengue ? '#ec4899' : '#e4e4e7'}`, 
                  borderRadius: '16px', 
                  background: hasMerengue ? '#fdf2f8' : 'transparent',
                  marginBottom: '1.75rem',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '6px',
                    border: `2px solid ${hasMerengue ? '#ec4899' : '#d4d4d8'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hasMerengue ? '#ec4899' : 'transparent'
                  }}>
                    {hasMerengue && <Check size={12} color="white" />}
                  </div>
                  <input type="checkbox" checked={hasMerengue} onChange={e => setHasMerengue(e.target.checked)} style={{ display: 'none' }} />
                  <span>Añadir Merengue</span>
                </label>
              )}

              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#18181b', marginBottom: '1rem' }}>
                Elige tus toppings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.625rem', marginBottom: '2rem' }}>
                {availableToppings.map(t => {
                  const isSelected = selectedToppings.find(x => x.id === t.id);
                  return (
                    <motion.div 
                      key={t.id} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleTopping(t)}
                      style={{
                        padding: '0.875rem',
                        border: `2px solid ${isSelected ? '#ec4899' : '#e4e4e7'}`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#fdf2f8' : 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#18181b' }}>{t.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 600 }}>+${t.price}</span>
                    </motion.div>
                  )
                })}
              </div>

              <button 
                onClick={addToCart}
                style={{ 
                  width: '100%', 
                  height: '3.5rem', 
                  background: '#ec4899', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '16px', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }} 
              >
                Añadir al pedido
                <ChevronRight size={18} />
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
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              style={{ width: '420px', maxWidth: '95%', background: 'white', borderRadius: '24px', padding: '2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#18181b' }}>{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
                <button style={{ background: '#f4f4f5', borderRadius: '10px', padding: '0.375rem', border: 'none', cursor: 'pointer' }} onClick={() => setIsProductFormOpen(false)}>
                  <X size={18} style={{ color: '#71717a' }} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#52525b' }}>Nombre</label>
                  <input 
                    type="text" 
                    value={productForm.name} 
                    onChange={e => setProductForm({...productForm, name: e.target.value})} 
                    placeholder="Ej. Yogurt Grande"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '0.9375rem', outline: 'none' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#52525b' }}>Categoría</label>
                  <select 
                    value={productForm.category} 
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '0.9375rem', outline: 'none', background: 'white' }}
                  >
                    <option value="YOGURT">Yogurt Helado</option>
                    <option value="GRANIZADO">Granizado</option>
                    <option value="BROWNIE">Brownie</option>
                    <option value="CONO">Cono / Waffle</option>
                    <option value="TOPPING">Topping</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#52525b' }}>Precio ($)</label>
                  <input 
                    type="number" 
                    value={productForm.price || ''} 
                    onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})} 
                    placeholder="0"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '0.9375rem', outline: 'none' }}
                  />
                </div>

                {productForm.category !== 'TOPPING' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#52525b' }}>Toppings incluidos</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={productForm.includedToppings || 0} 
                      onChange={e => setProductForm({...productForm, includedToppings: parseInt(e.target.value) || 0})} 
                      style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '0.9375rem', outline: 'none' }}
                    />
                  </div>
                )}
                
                <button 
                  onClick={saveProduct} 
                  style={{ marginTop: '0.5rem', width: '100%', height: '3rem', background: '#18181b', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}