"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Package, BarChart3, IceCream2, CalendarDays, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

function readUsernameFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const userCookie = document.cookie.split('; ').find(row => row.startsWith('koolt_user='));
  if (!userCookie) return null;
  const raw = decodeURIComponent(userCookie.split('=')[1] || '');
  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const username = useMemo(() => {
    void pathname;
    return readUsernameFromCookie();
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
        <div
          style={{
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            padding: '0.625rem',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IceCream2 size={22} color="white" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>Koolt</span>
          <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>POS</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div
          style={{
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            width: 40,
            height: 40,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {username ? username.charAt(0).toUpperCase() : '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sesión</p>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {username || 'Cargando...'}
          </p>
        </div>
      </div>

      <nav className="nav-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ color: '#ef4444', border: 'none', background: 'transparent', width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          <span>Salir</span>
        </button>
        <div className="sidebar-version">Koolt POS · v3.0</div>
      </div>
    </aside>
  );
}
