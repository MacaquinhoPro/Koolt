import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'today';
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    
    let gteLimit = new Date(0);
    let lteLimit = new Date();
    const now = new Date();
    
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
      where: { 
        createdAt: { 
          gte: gteLimit,
          lte: lteLimit
        } 
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    });

    const products = await prisma.product.findMany();

    // Calculators
    let totalEarned = 0;
    let earnedNequi = 0;
    let earnedEfectivo = 0;
    let totalItemsSold = 0;

    const salesMap: Record<string, number> = {};
    const chartDataMap: Record<string, number> = {};

    for (const p of products) {
      if (p.category !== 'TOPPING') {
        salesMap[p.name] = 0;
      }
    }

    orders.forEach(o => {
      totalEarned += o.totalPrice;
      if (o.paymentMethod === 'NEQUI') earnedNequi += o.totalPrice;
      if (o.paymentMethod === 'EFECTIVO') earnedEfectivo += o.totalPrice;

      // Group by day for the chart
      const dayStr = format(new Date(o.createdAt), 'yyyy-MM-dd');
      chartDataMap[dayStr] = (chartDataMap[dayStr] || 0) + o.totalPrice;

      o.items.forEach(i => {
        totalItemsSold++;
        if (salesMap[i.productName] !== undefined) {
          salesMap[i.productName]++;
        } else {
          salesMap[i.productName] = 1;
        }
      });
    });

    // Format chart data for recharts
    const chartData = Object.entries(chartDataMap).map(([date, amount]) => ({
      date,
      amount
    }));

    let topSeller = 'N/A';
    let maxSold = 0;
    const zeroSales = [];

    for (const [name, count] of Object.entries(salesMap)) {
      if (count > maxSold) {
        maxSold = count;
        topSeller = name;
      }
      if (count === 0) {
        zeroSales.push(name);
      }
    }

    const netProfit = totalEarned * 0.6; // Ganancia del 60%

    return NextResponse.json({
      ordersCount: orders.length,
      totalEarned,
      netProfit,
      earnedNequi,
      earnedEfectivo,
      totalItemsSold,
      topSeller,
      zeroSales,
      productSales: salesMap,
      chartData // Included timeseries
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
