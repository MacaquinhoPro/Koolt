import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'today';
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const now = new Date();
    let gteLimit = new Date(0);
    let lteLimit = new Date();

    if (filter === 'custom' && fromStr && toStr) {
      gteLimit = startOfDay(parseISO(fromStr));
      lteLimit = endOfDay(parseISO(toStr));
    } else if (filter === 'today') {
      gteLimit = startOfDay(now);
      lteLimit = endOfDay(now);
    } else if (filter === 'week') {
      gteLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filter === 'month') {
      gteLimit = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (filter === '3months') {
      gteLimit = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (filter === 'all') {
      gteLimit = new Date(0);
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: gteLimit, lte: lteLimit } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const products = await prisma.product.findMany();

    let totalEarned = 0;
    let earnedNequi = 0;
    let earnedEfectivo = 0;
    let totalItemsSold = 0;

    const salesMap: Record<string, number> = {};
    const categorySales: Record<string, number> = {};
    const chartDataMap: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    const hourlyMap: Record<number, number> = {};

    for (const p of products) {
      if (p.category !== 'TOPPING') salesMap[p.name] = 0;
    }

    const categoryByProductName = new Map<string, string>();
    for (const p of products) categoryByProductName.set(p.name, p.category);

    for (const o of orders) {
      totalEarned += o.totalPrice;
      if (o.paymentMethod === 'NEQUI') earnedNequi += o.totalPrice;
      if (o.paymentMethod === 'EFECTIVO') earnedEfectivo += o.totalPrice;

      const dayStr = format(new Date(o.createdAt), 'yyyy-MM-dd');
      chartDataMap[dayStr] = (chartDataMap[dayStr] || 0) + o.totalPrice;
      ordersByDay[dayStr] = (ordersByDay[dayStr] || 0) + 1;

      const hour = new Date(o.createdAt).getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + o.totalPrice;

      for (const i of o.items) {
        totalItemsSold++;
        salesMap[i.productName] = (salesMap[i.productName] || 0) + 1;
        const cat = categoryByProductName.get(i.productName) || 'OTRO';
        categorySales[cat] = (categorySales[cat] || 0) + i.price;
      }
    }

    // Build a continuous chartData (fills empty days with 0) when range is small
    let chartData: { date: string; amount: number; orders: number }[];
    if (filter !== 'all' && gteLimit.getTime() > 0) {
      const days = eachDayOfInterval({ start: startOfDay(gteLimit), end: endOfDay(lteLimit) });
      chartData = days.map(d => {
        const k = format(d, 'yyyy-MM-dd');
        return { date: k, amount: chartDataMap[k] || 0, orders: ordersByDay[k] || 0 };
      });
    } else {
      chartData = Object.entries(chartDataMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date, amount, orders: ordersByDay[date] || 0 }));
    }

    let topSeller = 'N/A';
    let maxSold = 0;
    const zeroSales: string[] = [];
    for (const [name, count] of Object.entries(salesMap)) {
      if (count > maxSold) {
        maxSold = count;
        topSeller = name;
      }
      if (count === 0) zeroSales.push(name);
    }

    const avgTicket = orders.length > 0 ? totalEarned / orders.length : 0;
    const netProfit = totalEarned * 0.6;

    let bestHour = 0;
    let bestHourAmount = 0;
    for (const [h, v] of Object.entries(hourlyMap)) {
      if (v > bestHourAmount) {
        bestHourAmount = v;
        bestHour = parseInt(h, 10);
      }
    }

    const hourlyData = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      amount: hourlyMap[h] || 0,
    }));

    return NextResponse.json({
      ordersCount: orders.length,
      totalEarned,
      netProfit,
      avgTicket,
      earnedNequi,
      earnedEfectivo,
      totalItemsSold,
      topSeller,
      bestHour: `${String(bestHour).padStart(2, '0')}:00`,
      bestHourAmount,
      zeroSales,
      productSales: salesMap,
      categorySales,
      chartData,
      hourlyData,
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
