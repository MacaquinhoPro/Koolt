import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { price: 'asc' },
      include: { ingredients: { include: { inventoryItem: true } } }
    });
    
    const formatted = products.map(p => ({
      ...p,
      ingredients: p.ingredients.map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantity: i.quantity,
        inventoryItem: i.inventoryItem
      }))
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to find products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredients, ...productData } = body;
    
    console.log('POST ingredients:', JSON.stringify(ingredients));
    
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        category: productData.category,
        price: parseFloat(productData.price),
        includedToppings: parseInt(productData.includedToppings || '0'),
        ...(ingredients && ingredients.length > 0 ? {
          ingredients: {
            create: ingredients.map((ing: { inventoryItemId: string; quantity: number }) => ({
              inventoryItemId: ing.inventoryItemId,
              quantity: parseFloat(ing.quantity)
            }))
          }
        } : {})
      },
      include: { ingredients: { include: { inventoryItem: true } } }
    });
    
    console.log('Created product with ingredients:', JSON.stringify(product.ingredients));
    
    const formatted = {
      ...product,
      ingredients: product.ingredients.map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantity: i.quantity,
        inventoryItem: i.inventoryItem
      }))
    };
    
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
