"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Package, BarChart3, IceCream2, CalendarDays, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const userCookie = cookies.find(row => row.startsWith('koolt_user='));
    if (userCookie) {
      const name = userCookie.split('=')[1];
      setUsername(decodeURIComponent(name).charAt(0).toUpperCase() + decodeURIComponent(name).slice(1));
    }
  }, [pathname]);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    const toastId = toast.loading('Cerrando sesión...');
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Sesión cerrada', { id: toastId });
        router.push('/login');
        router.refresh();
      }
    } catch {
      toast.error('Error al cerrar sesión', { id: toastId });
    }
  };

  const menuItems = [
    { href: '/', label: 'Pedidos', icon: ShoppingCart },
    { href: '/inventory', label: 'Inventario', icon: Package },
    { href: '/expirations', label: 'Vencimientos', icon: CalendarDays },
    { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', padding: '0.75rem', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IceCream2 size={28} color="white" />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#18181b', letterSpacing: '-0.02em' }}>Koolt</span>
      </div>

      <div className="sidebar-user">
        <div style={{ 
          background: 'linear-gradient(135deg, #ec4899, #a855f7)', 
          width: 44, 
          height: 44, 
          borderRadius: 14, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.125rem'
        }}>
          {username ? username.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <p style={{ fontSize: '0.6875rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Usuario</p>
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#18181b' }}>{username || 'Cargando...'}</p>
        </div>
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
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-item" style={{ color: '#ef4444', border: 'none', background: 'transparent', width: '100%', justifyContent: 'flex-start' }}>
          <LogOut size={20} />
          <span>Salir</span>
        </button>
        <div className="sidebar-version">v2.2</div>
      </div>
    </aside>
  );
}