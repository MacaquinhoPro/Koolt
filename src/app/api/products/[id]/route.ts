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
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.includedToppings !== undefined) updateData.includedToppings = parseInt(body.includedToppings);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/products/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update product details' }, { status: 500 });
  }
}
