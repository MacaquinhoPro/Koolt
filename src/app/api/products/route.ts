import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to find products' }, { status: 500 });
  }
}
