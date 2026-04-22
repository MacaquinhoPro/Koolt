import ExpirationsClient from './ExpirationsClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ExpirationsPage() {
  const initialItems = await prisma.expirationItem.findMany({
    include: { inventoryItem: true },
    orderBy: { expirationDate: 'asc' }
  });
  
  const inventoryItems = await prisma.inventoryItem.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--accent-blue)' }}>📅 Fechas de Vencimiento</h1>
      <ExpirationsClient initialItems={initialItems} inventoryItems={inventoryItems} />
    </div>
  );
}
