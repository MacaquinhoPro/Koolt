"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { IceCream2, CupSoda, CakeSlice, ShoppingBag, X, Check, Trash2, Plus } from 'lucide-react';

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // Modal states
  const [selectedToppings, setSelectedToppings] = useState<Product[]>([]);
  const [hasMerengue, setHasMerengue] = useState(false);

  // Grouped products
  const bases = products.filter(p => p.category !== 'TOPPING');
  const availableToppings = products.filter(p => p.category === 'TOPPING');

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
    toast.success(`${newItem.productName} agregado al carrito`, { icon: '🛒' });
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
        toast.success(`¡Pedido creado correctamente!`, { id: toastId });
        setCart([]);
      } else {
        toast.error("Error al confirmar el pedido.", { id: toastId });
      }
    } catch {
      toast.error("Error de red.", { id: toastId });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'YOGURT': return <IceCream2 size={40} className="text-pink-500" />;
      case 'GRANIZADO': return <CupSoda size={40} className="text-blue-500" />;
      case 'BROWNIE': return <CakeSlice size={40} className="text-amber-700" />;
      default: return <IceCream2 size={40} />;
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Product Selection List */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag /> Selecciona el Producto Base
        </h2>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid-container"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}
        >
          {bases.map((p, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              key={p.id} 
              className="card flex flex-col items-center justify-center text-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow" 
              onClick={() => openProductModal(p)}
              style={{
                background: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div style={{ padding: '1rem', background: 'var(--bg-light)', borderRadius: '50%' }}>
                {getCategoryIcon(p.category)}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</h3>
              <p style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '1.1rem' }}>${p.price.toLocaleString()}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Cart Panel */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCartIcon /> Carrito
        </h2>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
              >
                <ShoppingBag size={48} color="var(--border-color)" />
                El carrito está vacío.
              </motion.p>
            ) : (
              cart.map(item => (
                <motion.div 
                  key={item.uiId} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-light)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: '600', fontSize: '1.1rem' }}>{item.productName}</h4>
                    <button onClick={() => removeFromCart(item.uiId)} style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer', padding: '0.2rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {item.toppings.length > 0 ? `Toppings: ${item.toppings.join(', ')}` : 'Sin Toppings'}
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '1.1rem' }}>${item.price.toLocaleString()}</div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            <span>Total:</span>
            <span style={{ color: 'var(--accent-blue)' }}>${totalCart.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" style={{ flex: 1, background: '#6f42c1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={() => checkout('NEQUI')} disabled={cart.length === 0}>
              Nequi
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-success" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={() => checkout('EFECTIVO')} disabled={cart.length === 0}>
              Efectivo
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal / Options Panel */}
      <AnimatePresence>
        {activeProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card" style={{ width: '550px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{activeProduct.name}</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} onClick={() => setActiveProduct(null)}>
                  <X size={24} color="var(--text-secondary)" />
                </button>
              </div>
              
              <div style={{ background: 'var(--accent-lt-blue)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--accent-blue)', fontWeight: '500' }}>
                Incluye {activeProduct.includedToppings} {activeProduct.includedToppings === 1 ? 'topping' : 'toppings'}. 
                Los adicionales tienen costo extra.
              </div>

              {activeProduct.category === 'GRANIZADO' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: hasMerengue ? 'var(--bg-light)' : 'transparent' }}>
                    <input type="checkbox" checked={hasMerengue} onChange={e => setHasMerengue(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} />
                    Con Merengue
                  </label>
                </div>
              )}

              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: '600' }}>Elige tus Toppings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                {availableToppings.map(t => {
                  const isSelected = selectedToppings.find(x => x.id === t.id);
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={t.id} 
                      onClick={() => toggleTopping(t)}
                      style={{
                        padding: '1rem',
                        border: `2px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--accent-lt-blue)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1.05rem', color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{t.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          +${t.price} (si es extra)
                        </div>
                      </div>
                      {isSelected && <Check size={20} color="var(--accent-blue)" />}
                    </motion.div>
                  )
                })}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-success" 
                style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} 
                onClick={addToCart}
              >
                <Plus /> Agregar al Carrito
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper icon
const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);
