import ProductsClient from './ProductsClient';
import { prisma } from '@/lib/prisma';

export default async function ProductsPage() {
  const initialProducts = await prisma.product.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });
  
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--accent-blue)' }}>📋 Menú y Productos de Koolt</h1>
      <ProductsClient initialProducts={initialProducts} />
    </div>
  );
}
