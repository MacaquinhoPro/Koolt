import InventoryClient from './InventoryClient';
import { prisma } from '@/lib/prisma';

export default async function InventoryPage() {
  const initialItems = await prisma.inventoryItem.findMany({
    include: { expirationItems: true },
    orderBy: { name: 'asc' }
  });
  
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--accent-blue)' }}>📦 Inventario de Koolt</h1>
      <InventoryClient initialItems={initialItems} />
    </div>
  );
}
