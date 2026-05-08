import DashboardClient from './DashboardClient';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const now = new Date();

  const [products, inventory, todayOrders, recentOrders] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
      include: { ingredients: { include: { inventoryItem: true } } },
    }),
    prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      select: { id: true, totalPrice: true, paymentMethod: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { items: true },
    }),
  ]);

  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.totalPrice, 0);

  return (
    <DashboardClient
      products={products}
      inventory={inventory}
      todayOrdersCount={todayOrders.length}
      todayRevenue={todayRevenue}
      recentOrders={recentOrders.map(o => ({
        id: o.id,
        totalPrice: o.totalPrice,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map(i => ({
          id: i.id,
          productName: i.productName,
          price: i.price,
          toppings: i.toppings,
          merengue: i.merengue,
        })),
      }))}
    />
  );
}
