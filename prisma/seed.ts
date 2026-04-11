import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // Base Products
  const products = [
    { name: 'Helado de Yogurt Pequeño', category: 'YOGURT', price: 6000, includedToppings: 2 },
    { name: 'Helado de Yogurt Mediano', category: 'YOGURT', price: 8000, includedToppings: 3 },
    { name: 'Helado de Yogurt Grande', category: 'YOGURT', price: 10000, includedToppings: 4 },
    { name: 'Granizado', category: 'GRANIZADO', price: 7000, includedToppings: 1 },
    { name: 'Brownie con Helado', category: 'BROWNIE', price: 9000, includedToppings: 1 },
    { name: 'Cono Koolt', category: 'CONO', price: 4000, includedToppings: 1 },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  // Toppings
  const toppings = [
    { name: 'Oreo', category: 'TOPPING', price: 1500, includedToppings: 0 },
    { name: 'M&Ms', category: 'TOPPING', price: 1500, includedToppings: 0 },
    { name: 'Fresa Fresca', category: 'TOPPING', price: 1500, includedToppings: 0 },
    { name: 'Mango', category: 'TOPPING', price: 1500, includedToppings: 0 },
    { name: 'Brownie en trozos', category: 'TOPPING', price: 1500, includedToppings: 0 },
    { name: 'Salsa de Chocolate', category: 'TOPPING', price: 1000, includedToppings: 0 },
    { name: 'Leche Condensada', category: 'TOPPING', price: 1000, includedToppings: 0 },
  ];

  for (const t of toppings) {
    await prisma.product.create({ data: t });
  }

  // Basic Inventory Default
  const inventory = [
    { name: 'Vasos Pequeños', quantity: 100, unit: 'unidades', lowThreshold: 20 },
    { name: 'Vasos Medianos', quantity: 100, unit: 'unidades', lowThreshold: 20 },
    { name: 'Vasos Grandes', quantity: 100, unit: 'unidades', lowThreshold: 20 },
    { name: 'Cucharas', quantity: 500, unit: 'unidades', lowThreshold: 50 },
    { name: 'Mezcla Helado Yogurt', quantity: 10, unit: 'litros', lowThreshold: 3 },
    { name: 'Salsa de Chocolate (Bolsa)', quantity: 4, unit: 'bolsas', lowThreshold: 1 },
    { name: 'Bolsa de Oreo', quantity: 5, unit: 'bolsas', lowThreshold: 2 },
  ];

  for (const inv of inventory) {
    await prisma.inventoryItem.create({ data: inv });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
