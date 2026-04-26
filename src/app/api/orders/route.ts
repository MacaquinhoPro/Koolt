import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { items, paymentMethod, totalPrice } = await req.json();

    const order = await prisma.order.create({
      data: {
        totalPrice,
        paymentMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            toppings: JSON.stringify(item.toppings),
            merengue: item.merengue || false
          }))
        }
      }
    });

    // Get current inventory
    const allInventory = await prisma.inventoryItem.findMany();
    console.log('Inventory items:', allInventory.map(i => ({ id: i.id, name: i.name, qty: i.quantity })));
    const inventoryMap = new Map(allInventory.map(i => [i.id, i]));

    // Get all products with their ingredients
    const productIds = [...new Set(items.map((i: any) => i.productId))];
    console.log('Items in order:', items.map((i: any) => ({ productId: i.productId, productName: i.productName })));
    console.log('Product IDs:', productIds);
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { ingredients: true }
    });

    console.log('Products in order:', JSON.stringify(products.map(p => ({ id: p.id, name: p.name, ingredients: p.ingredients }))));

    // Reduce inventory based on product ingredients (quantity per item)
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      console.log('Processing item:', item.productName, 'product:', product?.name, 'ingredients:', product?.ingredients?.length);
      
      if (product && product.ingredients && product.ingredients.length > 0) {
        for (const ing of product.ingredients) {
          const invItem = inventoryMap.get(ing.inventoryItemId);
          console.log('Reducing inventory:', invItem?.name, 'by', ing.quantity, 'current:', invItem?.quantity);
          if (invItem) {
            await prisma.inventoryItem.update({
              where: { id: invItem.id },
              data: { quantity: Math.max(0, invItem.quantity - ing.quantity) }
            });
          }
        }
      } else {
        console.log('No ingredients found for product:', product?.name);
      }
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Order error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create order: ' + error.message }, { status: 500 });
  }
}
