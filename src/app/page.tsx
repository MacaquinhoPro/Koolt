import DashboardClient from './DashboardClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const products = await prisma.product.findMany({
    include: { ingredients: { include: { inventoryItem: true } } }
  });
  
  const inventory = await prisma.inventoryItem.findMany({
    orderBy: { name: 'asc' }
  });

  const formattedProducts = products.map(p => ({
    ...p,
    ingredients: p.ingredients.map(i => ({
      inventoryItemId: i.inventoryItemId,
      quantity: i.quantity,
      inventoryItem: i.inventoryItem
    }))
  }));

  return (
    <main>
      <DashboardClient products={formattedProducts} inventory={inventory} />
    </main>
  );
}
