import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany();
    return NextResponse.json(items);
  } catch (err) {
    console.error('GET /api/inventory error:', err);
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
    console.error('PATCH /api/inventory error:', err);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await prisma.inventoryItem.create({
      data: {
        name: body.name,
        quantity: parseFloat(body.quantity || 0),
        unit: body.unit,
        lowThreshold: parseFloat(body.lowThreshold || 5)
      }
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error('POST /api/inventory error:', err);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
