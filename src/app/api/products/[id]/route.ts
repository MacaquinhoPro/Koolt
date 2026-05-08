import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { ingredients, ...productData } = body;

    await prisma.$transaction(async tx => {
      if (Array.isArray(ingredients)) {
        await tx.productIngredient.deleteMany({ where: { productId: id } });
        if (ingredients.length > 0) {
          await tx.productIngredient.createMany({
            data: ingredients.map((ing: { inventoryItemId: string; quantity: number | string }) => ({
              productId: id,
              inventoryItemId: ing.inventoryItemId,
              quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity) : ing.quantity,
            })),
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (productData.name !== undefined) updateData.name = String(productData.name).trim();
      if (productData.price !== undefined) updateData.price = parseFloat(productData.price);
      if (productData.category !== undefined) updateData.category = productData.category;
      if (productData.includedToppings !== undefined) {
        updateData.includedToppings = parseInt(productData.includedToppings, 10) || 0;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.product.update({ where: { id }, data: updateData });
      }
    });

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { ingredients: { include: { inventoryItem: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('PATCH /api/products/[id] error:', message);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
