import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type IncomingItem = {
  productId: string;
  productName: string;
  price: number;
  toppings?: string[];
  merengue?: boolean;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { items: true },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? (body.items as IncomingItem[]) : [];
    const paymentMethod: string = body.paymentMethod;
    const totalPrice: number = Number(body.totalPrice);

    if (items.length === 0) {
      return NextResponse.json({ error: 'El pedido no tiene items' }, { status: 400 });
    }
    if (!['NEQUI', 'EFECTIVO'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 });
    }
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 });
    }

    const productIds = Array.from(new Set(items.map(i => i.productId)));
    const productsWithIngredients = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { ingredients: true },
    });

    // Map topping name -> ingredients (so toppings also reduce inventory)
    const toppingsByName = new Map<string, { inventoryItemId: string; quantity: number }[]>();
    const allToppings = await prisma.product.findMany({
      where: { category: 'TOPPING' },
      include: { ingredients: true },
    });
    for (const t of allToppings) {
      toppingsByName.set(
        t.name,
        t.ingredients.map(i => ({ inventoryItemId: i.inventoryItemId, quantity: i.quantity })),
      );
    }

    // Aggregate inventory consumption
    const consumption = new Map<string, number>();
    const accumulate = (invId: string, qty: number) => {
      consumption.set(invId, (consumption.get(invId) || 0) + qty);
    };
    for (const item of items) {
      const product = productsWithIngredients.find(p => p.id === item.productId);
      if (product) {
        for (const ing of product.ingredients) accumulate(ing.inventoryItemId, ing.quantity);
      }
      for (const tName of item.toppings || []) {
        const ings = toppingsByName.get(tName);
        if (ings) for (const ing of ings) accumulate(ing.inventoryItemId, ing.quantity);
      }
    }

    const order = await prisma.$transaction(async tx => {
      const created = await tx.order.create({
        data: {
          totalPrice,
          paymentMethod,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              toppings: JSON.stringify(item.toppings || []),
              merengue: !!item.merengue,
            })),
          },
        },
        include: { items: true },
      });

      for (const [invId, qty] of consumption) {
        await tx.inventoryItem.update({
          where: { id: invId },
          data: { quantity: { decrement: qty } },
        });
      }

      return created;
    });

    return NextResponse.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/orders error:', message);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
