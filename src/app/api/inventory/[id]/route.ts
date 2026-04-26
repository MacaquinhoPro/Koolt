import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.inventoryItem.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/inventory/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.quantity !== undefined) updateData.quantity = parseFloat(body.quantity);
    if (body.lowThreshold !== undefined) updateData.lowThreshold = parseFloat(body.lowThreshold);

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/inventory/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update inventory details' }, { status: 500 });
  }
}
