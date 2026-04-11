import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany();
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to find inventory items' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, quantity } = await req.json();
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: parseFloat(quantity) }
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
