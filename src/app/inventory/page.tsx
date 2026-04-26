import InventoryClient from './InventoryClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const initialItems = await prisma.inventoryItem.findMany({
    include: { expirationItems: true },
    orderBy: { name: 'asc' }
  });
  
  return (
    <main>
      <InventoryClient initialItems={initialItems} />
    </main>
  );
}
