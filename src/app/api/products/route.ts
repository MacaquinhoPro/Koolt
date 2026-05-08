import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_CATEGORIES = new Set(['YOGURT', 'GRANIZADO', 'BROWNIE', 'CONO', 'TOPPING', 'OTRO']);

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
      include: { ingredients: { include: { inventoryItem: true } } },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to find products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredients, ...productData } = body;

    if (!productData.name || typeof productData.name !== 'string') {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }
    if (!VALID_CATEGORIES.has(productData.category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
    }
    const price = parseFloat(productData.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: productData.name.trim(),
        category: productData.category,
        price,
        includedToppings: parseInt(productData.includedToppings || '0', 10) || 0,
        ...(Array.isArray(ingredients) && ingredients.length > 0
          ? {
              ingredients: {
                create: ingredients.map((ing: { inventoryItemId: string; quantity: number | string }) => ({
                  inventoryItemId: ing.inventoryItemId,
                  quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity) : ing.quantity,
                })),
              },
            }
          : {}),
      },
      include: { ingredients: { include: { inventoryItem: true } } },
    });

    return NextResponse.json(product);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/products error:', message);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
