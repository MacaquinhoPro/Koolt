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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        price: parseFloat(body.price),
        includedToppings: parseInt(body.includedToppings || '0')
      }
    });
    return NextResponse.json(product);
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
