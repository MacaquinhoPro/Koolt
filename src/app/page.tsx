import DashboardClient from './DashboardClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const products = await prisma.product.findMany();

  return (
    <main>
      <DashboardClient products={products} />
    </main>
  );
}
