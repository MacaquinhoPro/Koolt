import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { ShoppingCart, Package, BarChart3, IceCream2, CalendarDays } from 'lucide-react';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Koolt POS',
  description: 'Point of Sale app for Koolt Ice Cream Shop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={outfit.className}>
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IceCream2 /> Koolt POS
            </div>
            <nav className="nav-menu">
              <Link href="/" className="nav-item">
                <ShoppingCart size={20} /> Crear Pedido
              </Link>
              <Link href="/inventory" className="nav-item">
                <Package size={20} /> Inventario
              </Link>
              <Link href="/expirations" className="nav-item">
                <CalendarDays size={20} /> Vencimientos
              </Link>
              <Link href="/stats" className="nav-item">
                <BarChart3 size={20} /> Estadísticas
              </Link>
            </nav>
          </aside>
          <main className="main-content">
            {children}
            <Toaster position="bottom-right" />
          </main>
        </div>
      </body>
    </html>
  );
}
