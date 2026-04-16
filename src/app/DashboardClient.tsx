"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { IceCream2, CupSoda, CakeSlice, ShoppingBag, X, Check, Trash2, Plus, Edit2, Settings2 } from 'lucide-react';

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
    <div className="dashboard-layout">
      {/* Product Selection List */}
      <div className="dashboard-panel-left">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag /> Selecciona el Producto Base
          </h2>
          <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isEditingMode ? 'var(--bg-light)' : 'var(--accent-lt-blue)', color: 'var(--accent-blue)' }} onClick={() => setIsEditingMode(!isEditingMode)}>
            <Settings2 size={18} /> {isEditingMode ? 'Salir Edición' : 'Gestionar Productos'}
          </button>
        </div>
        
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
              whileHover={!isEditingMode ? { scale: 1.05, translateY: -5 } : {}}
              whileTap={!isEditingMode ? { scale: 0.95 } : {}}
              key={p.id} 
              className="card flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow relative" 
              onClick={() => !isEditingMode && openProductModal(p)}
              style={{
                background: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                cursor: isEditingMode ? 'default' : 'pointer'
              }}
            >
              <div style={{ padding: '1rem', background: 'var(--bg-light)', borderRadius: '50%' }}>
                {getCategoryIcon(p.category)}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</h3>
              <p style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '1.1rem' }}>${p.price.toLocaleString('es-CO')}</p>
              
              {isEditingMode && (
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.5rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); openProductForm(p); }} style={{ padding: '0.4rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => deleteProduct(p.id, e)} style={{ padding: '0.4rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--danger-red)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {isEditingMode && (
             <motion.div 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="card flex flex-col items-center justify-center text-center gap-3 cursor-pointer"
               onClick={() => openProductForm()}
               style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-light)', minHeight: '200px' }}
             >
               <Plus size={40} color="var(--text-secondary)" />
               <h3 style={{ color: 'var(--text-secondary)' }}>Añadir Base</h3>
             </motion.div>
          )}
        </motion.div>

        {isEditingMode && (
          <>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <Settings2 /> Gestionar Toppings
            </h2>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid-container"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}
            >
              {availableToppings.map((p, i) => (
                <motion.div key={p.id} className="card relative" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{p.name}</h3>
                  <p style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>${p.price.toLocaleString('es-CO')}</p>
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); openProductForm(p); }} style={{ padding: '0.4rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => deleteProduct(p.id, e)} style={{ padding: '0.4rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--danger-red)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
              <motion.div 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="card flex flex-col items-center justify-center text-center cursor-pointer"
                 onClick={() => {
                   setEditingProduct(null);
                   setProductForm({ name: '', category: 'TOPPING', price: 0, includedToppings: 0 });
                   setIsProductFormOpen(true);
                 }}
                 style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-light)', minHeight: '80px', padding: '1rem' }}
               >
                 <Plus size={24} color="var(--text-secondary)" />
                 <span style={{ color: 'var(--text-secondary)' }}>Añadir Topping</span>
               </motion.div>
            </motion.div>
          </>
        )}
      </div>

      {/* Cart Panel */}
      <div className="card dashboard-panel-right">
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
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '1.1rem' }}>${item.price.toLocaleString('es-CO')}</div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            <span>Total:</span>
            <span style={{ color: 'var(--accent-blue)' }}>${totalCart.toLocaleString('es-CO')}</span>
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

      {/* Product Edit/Create Form Modal */}
      <AnimatePresence>
        {isProductFormOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card" style={{ width: '400px', maxWidth: '95%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{editingProduct ? 'Editar' : 'Añadir'} Producto</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} onClick={() => setIsProductFormOpen(false)}>
                  <X size={24} color="var(--text-secondary)" />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="text" placeholder="Nombre (ej. Yogurt Helado)" 
                  value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} 
                  style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
                
                <select 
                  value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                  style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'white' }}
                >
                  <option value="YOGURT">Yogurt</option>
                  <option value="GRANIZADO">Granizado</option>
                  <option value="BROWNIE">Brownie</option>
                  <option value="CONO">Cono</option>
                  <option value="TOPPING">Topping</option>
                </select>

                <input 
                  type="number" placeholder="Precio ($)" 
                  value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})} 
                  style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />

                {productForm.category !== 'TOPPING' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Toppings Incluidos:</label>
                    <input 
                      type="number" min="0" 
                      value={productForm.includedToppings || 0} onChange={e => setProductForm({...productForm, includedToppings: parseInt(e.target.value) || 0})} 
                      style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: '80px' }}
                    />
                  </div>
                )}
                
                <button className="btn btn-primary" onClick={saveProduct} style={{ marginTop: '1rem', padding: '1rem', fontWeight: '600' }}>
                  Guardar Producto
                </button>
              </div>
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
