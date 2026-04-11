import DashboardClient from './DashboardClient';
import { prisma } from '@/lib/prisma';

export default async function Page() {
  const products = await prisma.product.findMany();

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--accent-blue)' }}>Crear Nuevo Pedido</h1>
      <DashboardClient products={products} />
    </div>
  );
}
