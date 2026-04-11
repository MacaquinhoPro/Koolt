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

    // Reduce inventory strictly mapping strings for simplicity
    const allInventory = await prisma.inventoryItem.findMany();
    for (const item of items) {
      // 1 cuchara per item except "Cono"
      if (item.category !== 'CONO') {
        const cuchara = allInventory.find(i => i.name.toLowerCase().includes('cuchara'));
        if (cuchara) await prisma.inventoryItem.update({ where: { id: cuchara.id }, data: { quantity: Math.max(0, cuchara.quantity - 1) } });
      }

      // Vaso or Mezcla logic 
      if (item.category === 'YOGURT') {
        const mezcla = allInventory.find(i => i.name.toLowerCase().includes('mezcla'));
        if (mezcla) await prisma.inventoryItem.update({ where: { id: mezcla.id }, data: { quantity: Math.max(0, mezcla.quantity - 0.1) } }); // approx 0.1L per yogurt
        
        const sizeLower = item.productName.toLowerCase();
        let vasoName = '';
        if (sizeLower.includes('pequeño')) vasoName = 'vasos pequeños';
        if (sizeLower.includes('mediano')) vasoName = 'vasos medianos';
        if (sizeLower.includes('grande')) vasoName = 'vasos grandes';
        
        const vaso = allInventory.find(i => i.name.toLowerCase() === vasoName);
        if (vaso) await prisma.inventoryItem.update({ where: { id: vaso.id }, data: { quantity: Math.max(0, vaso.quantity - 1) } });
      } else if (item.category === 'GRANIZADO') {
        const vaso = allInventory.find(i => i.name.toLowerCase() === 'vasos grandes');
        if (vaso) await prisma.inventoryItem.update({ where: { id: vaso.id }, data: { quantity: Math.max(0, vaso.quantity - 1) } });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
