"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, BarChart3, IceCream2, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Crear Pedido', icon: ShoppingCart },
    { href: '/inventory', label: 'Inventario', icon: Package },
    { href: '/expirations', label: 'Vencimientos', icon: CalendarDays },
    { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ 
          background: 'var(--primary-soft)', 
          padding: '0.5rem', 
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IceCream2 size={24} />
        </div>
        <span>Koolt POS</span>
      </div>
      
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="active-indicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: '4px',
                    height: '24px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '0 4px 4px 0'
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        padding: '1rem', 
        background: 'var(--bg-color)', 
        borderRadius: 'var(--radius-md)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        v2.0 Premium Design
      </div>
    </aside>
  );
}
