import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.expirationItem.findMany({
      include: { inventoryItem: true },
      orderBy: { expirationDate: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await prisma.expirationItem.create({
      data: {
        inventoryItemId: body.inventoryItemId,
        quantity: body.quantity,
        expirationDate: new Date(body.expirationDate),
        notes: body.notes
      },
      include: { inventoryItem: true }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
