"use client";

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Calendar, 
  DollarSign, 
  Wallet, 
  Banknote, 
  ShoppingCart, 
  Tag, 
  Award, 
  TrendingDown,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es';
import { format } from 'date-fns';
import CustomSelect from '@/components/CustomSelect';

registerLocale('es', es);
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type StatsData = {
  ordersCount: number;
  totalEarned: number;
  netProfit: number;
  earnedNequi: number;
  earnedEfectivo: number;
  totalItemsSold: number;
  topSeller: string;
  zeroSales: string[];
  productSales: Record<string, number>;
  chartData: { date: string, amount: number }[];
};

export default function StatsClient() {
  const [filter, setFilter] = useState('today');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    let url = `/api/stats?filter=${filter}`;
    if (filter === 'custom' && fromDate && toDate) {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');
      url += `&from=${fromStr}&to=${toStr}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (filter !== 'custom') {
      fetchStats();
    }
  }, [filter]);

  const exportExcel = () => {
    if (!data) return;

    const fechaReporte = format(new Date(), 'dd/MM/yyyy HH:mm');
    const titulo = `REPORTE DE VENTAS - KOOLT HELADERÍA`;
    const periodo = filter === 'today' ? 'HOY' : filter === 'week' ? 'ÚLTIMA SEMANA' : filter === 'month' ? 'ÚLTIMO MES' : filter === '3months' ? 'ÚLTIMOS 3 MESES' : filter === 'all' ? 'TODO EL HISTÓRICO' : 'PERSONALIZADO';

    const infoSheet = [
      { Metrica: "", Valor: "" },
      { Metrica: "═══════════════════════════════════════════════════", Valor: "═══════════════════════════════════════" },
      { Metrica: titulo, Valor: "" },
      { Metrica: "Fecha de reporte:", Valor: fechaReporte },
      { Metrica: "Período:", Valor: periodo },
      { Metrica: "═══════════════════════════════════════════════════", Valor: "═══════════════════════════════════════" },
      { Metrica: "", Valor: "" },
      { Metrica: "--- RESUMEN GENERAL ---", Valor: "" },
      { Metrica: "Pedidos Totales", Valor: data.ordersCount },
      { Metrica: "Unidades Vendidas", Valor: data.totalItemsSold },
      { Metrica: "Ingresos Totales", Valor: "$" + data.totalEarned.toLocaleString('es-CO') },
      { Metrica: "Ganancia Neta (60%)", Valor: "$" + data.netProfit.toLocaleString('es-CO') },
      { Metrica: "", Valor: "" },
      { Metrica: "--- MÉTODO DE PAGO ---", Valor: "" },
      { Metrica: "Ventas por Nequi", Valor: "$" + data.earnedNequi.toLocaleString('es-CO') },
      { Metrica: "Ventas en Efectivo", Valor: "$" + data.earnedEfectivo.toLocaleString('es-CO') },
      { Metrica: "% Nequi", Valor: data.totalEarned > 0 ? ((data.earnedNequi / data.totalEarned) * 100).toFixed(1) + "%" : "0%" },
      { Metrica: "% Efectivo", Valor: data.totalEarned > 0 ? ((data.earnedEfectivo / data.totalEarned) * 100).toFixed(1) + "%" : "0%" },
      { Metrica: "", Valor: "" },
      { Metrica: "--- PRODUCTO TOP ---", Valor: "" },
      { Metrica: "Producto más vendido", Valor: data.topSeller && data.productSales[data.topSeller] ? `${data.topSeller} (${data.productSales[data.topSeller]} unidades)` : "N/A" },
      { Metrica: "", Valor: "" },
      { Metrica: "--- PRODUCTOS SIN VENTA ---", Valor: "" },
      { Metrica: "Cantidad sin ventas", Valor: data.zeroSales.length },
      { Metrica: "Productos sin ventas", Valor: data.zeroSales.length > 0 ? data.zeroSales.join(', ') : "Todos tienen ventas" },
    ];

    const ventasSheet = [
      { Metrica: "--- DETALLE DE UNIDADES VENDIDAS POR PRODUCTO ---", Valor: "Unidades", Valor2: "Ingresos Estimados" },
    ];
    Object.entries(data.productSales || {}).forEach(([pName, count]) => {
      if (count > 0) {
        ventasSheet.push({ Metrica: pName, Valor: count, Valor2: "Consultar en sistema" });
      }
    });

    ventasSheet.push({ Metrica: "", Valor: "" });
    ventasSheet.push({ Metrica: "--- RESUMEN DIARIO ---", Valor: "Ventas", Valor2: "Pedidos (est.)" });
    data.chartData.forEach(d => {
      const pedidosEst = d.amount > 0 ? Math.max(1, Math.round(d.amount / 25000)) : 0;
      ventasSheet.push({ Metrica: d.date, Valor: "$" + d.amount.toLocaleString('es-CO'), Valor2: pedidosEst });
    });

    const resumenSheet = [
      { Metrica: "════════════════════════════════════", Valor: "════════════════════════════", Valor2: "═══════════" },
      { Metrica: "RESUMEN DE VENTAS", Valor: "", Valor2: "" },
      { Metrica: "════════════════════════════════════", Valor: "════════════════════════════", Valor2: "═══════════" },
      { Metrica: "", Valor: "", Valor2: "" },
      { Metrica: "MÉTRICA", Valor: " VALOR ", Valor2: " NOTA " },
      { Metrica: "──────────────", Valor: "───────────────", Valor2: "───────────" },
      { Metrica: "Pedidos", Valor: data.ordersCount, Valor2: "Órdenes procesadas" },
      { Metrica: "Unidades", Valor: data.totalItemsSold, Valor2: "Items vendidos" },
      { Metrica: "Ticket Promedio", Valor: data.ordersCount > 0 ? "$" + Math.round(data.totalEarned / data.ordersCount).toLocaleString('es-CO') : "$0", Valor2: "Por orden" },
      { Metrica: "Ingresos", Valor: "$" + data.totalEarned.toLocaleString('es-CO'), Valor2: "Total vendido" },
      { Metrica: "Ganancia", Valor: "$" + data.netProfit.toLocaleString('es-CO'), Valor2: "60% ingresos" },
    ];

    const wsInfo = XLSX.utils.json_to_sheet(infoSheet);
    const wsVentas = XLSX.utils.json_to_sheet(ventasSheet);
    const wsResumen = XLSX.utils.json_to_sheet(resumenSheet);

    const colWidths = [{ wch: 40 }, { wch: 20 }];
    wsInfo['!cols'] = colWidths;
    wsVentas['!cols'] = [{ wch: 45 }, { wch: 12 }, { wch: 18 }];
    wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInfo, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");
    XLSX.utils.book_append_sheet(wb, wsResumen, "Estadísticas");

    const fileName = `Reporte_Koolt_${filter}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading && !data) return <div style={{ color: 'var(--text-secondary)', padding: '5rem', textAlign: 'center' }}>Cargando estadísticas...</div>;
  if (!data) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '3rem' }}>
      
      {/* Filters and Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card" 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', border: 'none', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Calendar size={20} className="text-primary" />
            <span style={{ fontWeight: '700', fontSize: '0.9375rem' }}>Rango:</span>
            <CustomSelect 
              value={filter}
              onChange={(val) => setFilter(val)}
              options={[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Última Semana' },
                { value: 'month', label: 'Último Mes' },
                { value: '3months', label: 'Últimos 3 Meses' },
                { value: 'all', label: 'Histórico Completo' },
                { value: 'custom', label: 'Rango Personalizado' },
              ]}
              style={{ width: '220px' }}
            />
          </div>

          {filter === 'custom' && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <DatePicker
                selected={fromDate}
                onChange={(date: Date | null) => setFromDate(date)}
                selectsStart
                startDate={fromDate}
                endDate={toDate}
                locale="es"
                dateFormat="dd/MM/yyyy"
                placeholderText="Inicio"
                className="date-picker-input"
              />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <DatePicker
                selected={toDate}
                onChange={(date: Date | null) => setToDate(date)}
                selectsEnd
                startDate={fromDate}
                endDate={toDate}
                minDate={fromDate || undefined}
                locale="es"
                dateFormat="dd/MM/yyyy"
                placeholderText="Fin"
                className="date-picker-input"
              />
              <button className="btn btn-primary" onClick={fetchStats} disabled={!fromDate || !toDate}>
                Filtrar
              </button>
            </div>
          )}
        </div>
        
        <button className="btn btn-success" onClick={exportExcel}>
          <Download size={18} /> Exportar Reporte
        </button>
      </motion.div>

      {/* Main Metric Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}
      >
        {[
          { label: 'Ingresos Totales', value: data.totalEarned, icon: DollarSign, color: 'var(--primary)', soft: 'var(--primary-soft)' },
          { label: 'Ganancia Neta (60%)', value: data.netProfit, icon: ArrowUpRight, color: 'var(--success)', soft: 'var(--success-soft)' },
          { label: 'Ventas Nequi', value: data.earnedNequi, icon: Wallet, color: '#6366f1', soft: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Ventas Efectivo', value: data.earnedEfectivo, icon: Banknote, color: '#059669', soft: 'rgba(5, 150, 105, 0.1)' },
          { label: 'Pedidos Realizados', value: data.ordersCount, icon: ShoppingCart, color: 'var(--warning)', soft: 'var(--warning-soft)', isCurrency: false },
          { label: 'Ítems Vendidos', value: data.totalItemsSold, icon: Tag, color: '#ec4899', soft: 'rgba(236, 72, 153, 0.1)', isCurrency: false },
          { label: 'Top Producto', value: data.topSeller, icon: Award, color: '#8b5cf6', soft: 'rgba(139, 92, 246, 0.1)', isCurrency: false, isText: true }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{ background: stat.soft, padding: '1rem', borderRadius: '1.25rem' }}>
              <stat.icon size={28} style={{ color: stat.color }} />
            </div>
            <div>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{stat.label}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: stat.isText ? '700' : '800', color: 'var(--text-primary)' }}>
                {stat.isText ? stat.value : (stat.isCurrency === false ? stat.value : `$${Number(stat.value).toLocaleString('es-CO')}`)}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart Section */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card" style={{ flex: 2, height: '350px', minHeight: '350px', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 className="text-primary" size={24} /> Desempeño de Ventas
            </h3>
          </div>
          <div style={{ flex: 1, minHeight: 280 }}>
            {data.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-xl)', padding: '1rem' }}
                    formatter={(value: any) => [`$${value.toLocaleString('es-CO')}`, 'Ventas']} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)' }}>
                No hay datos suficientes para graficar.
              </div>
            )}
          </div>
        </motion.div>

        {/* Zero Sales Alerts */}
        <AnimatePresence>
          {data.zeroSales.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card" 
              style={{ border: 'none', background: 'var(--danger-soft)', borderTop: '4px solid var(--danger)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <TrendingDown className="text-danger" size={24} />
                <h3 style={{ color: 'var(--danger)', fontSize: '1.125rem', fontWeight: '800' }}>Sin Rotación</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                Los siguientes productos no han registrado unidades vendidas en este periodo:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.zeroSales.map((p, idx) => (
                  <span key={idx} style={{ background: 'white', color: 'var(--danger)', padding: '0.4rem 0.75rem', borderRadius: '0.75rem', fontSize: '0.8125rem', fontWeight: '700', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
