import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const productIds = Array.from(new Set(order.items.map(i => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { ingredients: true },
    });

    const allToppings = await prisma.product.findMany({
      where: { category: 'TOPPING' },
      include: { ingredients: true },
    });
    const toppingsByName = new Map<string, { inventoryItemId: string; quantity: number }[]>();
    for (const t of allToppings) {
      toppingsByName.set(
        t.name,
        t.ingredients.map(i => ({ inventoryItemId: i.inventoryItemId, quantity: i.quantity })),
      );
    }

    const restoration = new Map<string, number>();
    const accumulate = (invId: string, qty: number) => {
      restoration.set(invId, (restoration.get(invId) || 0) + qty);
    };
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) for (const ing of product.ingredients) accumulate(ing.inventoryItemId, ing.quantity);

      let parsedToppings: string[] = [];
      try {
        parsedToppings = JSON.parse(item.toppings || '[]');
      } catch {
        parsedToppings = [];
      }
      for (const tName of parsedToppings) {
        const ings = toppingsByName.get(tName);
        if (ings) for (const ing of ings) accumulate(ing.inventoryItemId, ing.quantity);
      }
    }

    await prisma.$transaction(async tx => {
      for (const [invId, qty] of restoration) {
        await tx.inventoryItem.update({
          where: { id: invId },
          data: { quantity: { increment: qty } },
        });
      }
      await tx.order.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
