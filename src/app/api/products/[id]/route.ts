import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/products/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { ingredients, ...productData } = body;
    
    console.log('PATCH body:', JSON.stringify(body));
    console.log('PATCH ingredients:', JSON.stringify(ingredients));
    
    if (ingredients) {
      console.log('Deleting existing ingredients for product:', id);
      await prisma.productIngredient.deleteMany({ where: { productId: id } });
      
      if (ingredients.length > 0) {
        console.log('Creating new ingredients:', ingredients);
        await prisma.productIngredient.createMany({
          data: ingredients.map((ing: { inventoryItemId: string; quantity: number }) => ({
            productId: id,
            inventoryItemId: ing.inventoryItemId,
            quantity: parseFloat(ing.quantity)
          }))
        });
      }
    }
    
    const updateData: any = {};
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.price !== undefined) updateData.price = parseFloat(productData.price);
    if (productData.category !== undefined) updateData.category = productData.category;
    if (productData.includedToppings !== undefined) updateData.includedToppings = parseInt(productData.includedToppings);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { ingredients: { include: { inventoryItem: true } } }
    });
    
    console.log('Updated product ingredients:', JSON.stringify(updated.ingredients));
    
    const formatted = {
      ...updated,
      ingredients: updated.ingredients.map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantity: i.quantity,
        inventoryItem: i.inventoryItem
      }))
    };
    
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('PATCH /api/products/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update product details' }, { status: 500 });
  }
}
