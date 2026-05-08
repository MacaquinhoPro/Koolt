"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  ArrowUpRight,
  Clock,
  Receipt,
} from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es';
import { format } from 'date-fns';
import CustomSelect from '@/components/CustomSelect';

registerLocale('es', es);
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type StatsData = {
  ordersCount: number;
  totalEarned: number;
  netProfit: number;
  avgTicket: number;
  earnedNequi: number;
  earnedEfectivo: number;
  totalItemsSold: number;
  topSeller: string;
  bestHour: string;
  bestHourAmount: number;
  zeroSales: string[];
  productSales: Record<string, number>;
  categorySales: Record<string, number>;
  chartData: { date: string; amount: number; orders: number }[];
  hourlyData: { hour: string; amount: number }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  YOGURT: 'Yogurt',
  GRANIZADO: 'Granizado',
  BROWNIE: 'Brownie',
  CONO: 'Conos',
  TOPPING: 'Toppings',
  OTRO: 'Otros',
};
const CATEGORY_COLORS = ['#ec4899', '#0ea5e9', '#92400e', '#f59e0b', '#8b5cf6', '#64748b'];

export default function StatsClient() {
  const [filter, setFilter] = useState('today');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      let url = `/api/stats?filter=${filter}`;
      if (filter === 'custom' && fromDate && toDate) {
        url += `&from=${format(fromDate, 'yyyy-MM-dd')}&to=${format(toDate, 'yyyy-MM-dd')}`;
      }
      try {
        const res = await fetch(url, { signal });
        const json = await res.json();
        if (!signal?.aborted) setData(json);
      } catch {
        // ignored
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filter, fromDate, toDate],
  );

  useEffect(() => {
    if (filter === 'custom') return;
    const ctrl = new AbortController();
    fetchStats(ctrl.signal);
    return () => ctrl.abort();
  }, [filter, fetchStats]);

  const exportExcel = () => {
    if (!data) return;
    const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
    const periodLabel =
      filter === 'today'
        ? 'Hoy'
        : filter === 'week'
        ? 'Última semana'
        : filter === 'month'
        ? 'Último mes'
        : filter === '3months'
        ? 'Últimos 3 meses'
        : filter === 'all'
        ? 'Histórico'
        : 'Personalizado';

    const summary = [
      { Métrica: 'Reporte', Valor: 'Koolt Heladería' },
      { Métrica: 'Generado', Valor: reportDate },
      { Métrica: 'Período', Valor: periodLabel },
      { Métrica: '', Valor: '' },
      { Métrica: 'Pedidos', Valor: data.ordersCount },
      { Métrica: 'Unidades vendidas', Valor: data.totalItemsSold },
      { Métrica: 'Ingresos totales', Valor: '$' + data.totalEarned.toLocaleString('es-CO') },
      { Métrica: 'Ganancia neta (60%)', Valor: '$' + data.netProfit.toLocaleString('es-CO') },
      { Métrica: 'Ticket promedio', Valor: '$' + Math.round(data.avgTicket).toLocaleString('es-CO') },
      { Métrica: 'Hora pico', Valor: data.bestHour },
      { Métrica: '', Valor: '' },
      { Métrica: 'Ventas Nequi', Valor: '$' + data.earnedNequi.toLocaleString('es-CO') },
      { Métrica: 'Ventas Efectivo', Valor: '$' + data.earnedEfectivo.toLocaleString('es-CO') },
    ];

    const productRows = Object.entries(data.productSales)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([n, c]) => ({ Producto: n, Unidades: c }));

    const dailyRows = data.chartData.map(d => ({ Fecha: d.date, Pedidos: d.orders, Ingresos: d.amount }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 24 }];
    const wsProducts = XLSX.utils.json_to_sheet(productRows);
    wsProducts['!cols'] = [{ wch: 36 }, { wch: 14 }];
    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    wsDaily['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Diario');
    XLSX.writeFile(wb, `Koolt_${filter}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const categoryPie = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.categorySales || {})
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v }));
  }, [data]);

  const topProducts = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.productSales)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  if (loading && !data)
    return (
      <div style={{ color: '#64748b', padding: '5rem', textAlign: 'center' }}>
        Cargando estadísticas...
      </div>
    );
  if (!data) return null;

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

  const stats = [
    { label: 'Ingresos', value: data.totalEarned, icon: DollarSign, color: '#6366f1', soft: '#eef2ff', currency: true },
    { label: 'Ganancia neta', value: data.netProfit, icon: ArrowUpRight, color: '#10b981', soft: '#ecfdf5', currency: true },
    { label: 'Ticket promedio', value: Math.round(data.avgTicket), icon: Receipt, color: '#0ea5e9', soft: '#e0f2fe', currency: true },
    { label: 'Pedidos', value: data.ordersCount, icon: ShoppingCart, color: '#f59e0b', soft: '#fef3c7', currency: false },
    { label: 'Unidades', value: data.totalItemsSold, icon: Tag, color: '#ec4899', soft: '#fdf2f8', currency: false },
    { label: 'Hora pico', value: data.bestHour, icon: Clock, color: '#8b5cf6', soft: '#f3e8ff', text: true },
    { label: 'Top producto', value: data.topSeller, icon: Award, color: '#ef4444', soft: '#fef2f2', text: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Estadísticas</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Indicadores y desempeño del negocio.</p>
        </div>
        <button
          className="btn-primary-action"
          onClick={exportExcel}
          style={{ background: '#10b981' }}
        >
          <Download size={18} /> Exportar Excel
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={18} style={{ color: '#6366f1' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Rango</span>
        </div>
        <CustomSelect
          value={filter}
          onChange={v => setFilter(v)}
          options={[
            { value: 'today', label: 'Hoy' },
            { value: 'week', label: 'Última semana' },
            { value: 'month', label: 'Último mes' },
            { value: '3months', label: 'Últimos 3 meses' },
            { value: 'all', label: 'Histórico' },
            { value: 'custom', label: 'Personalizado' },
          ]}
          style={{ width: 220 }}
        />

        {filter === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DatePicker
              selected={fromDate}
              onChange={(d: Date | null) => setFromDate(d)}
              selectsStart
              startDate={fromDate}
              endDate={toDate}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Inicio"
              className="date-picker-input"
            />
            <span style={{ color: '#94a3b8' }}>—</span>
            <DatePicker
              selected={toDate}
              onChange={(d: Date | null) => setToDate(d)}
              selectsEnd
              startDate={fromDate}
              endDate={toDate}
              minDate={fromDate || undefined}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Fin"
              className="date-picker-input"
            />
            <button className="btn-primary-action" onClick={() => fetchStats()} disabled={!fromDate || !toDate}>
              Filtrar
            </button>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}
      >
        {stats.map((s, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1.25rem' }}
          >
            <div style={{ background: s.soft, padding: 14, borderRadius: 16 }}>
              <s.icon size={22} style={{ color: s.color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
              <p
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.text ? s.value : s.currency ? `$${Number(s.value).toLocaleString('es-CO')}` : Number(s.value).toLocaleString('es-CO')}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Payment + Category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <PaymentBreakdown nequi={data.earnedNequi} efectivo={data.earnedEfectivo} total={data.totalEarned} />
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} style={{ color: '#6366f1' }} /> Ventas por categoría
          </h3>
          {categoryPie.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {categoryPie.map((_, idx) => (
                    <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString('es-CO')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sales chart */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} style={{ color: '#6366f1' }} /> Desempeño en el tiempo
        </h3>
        <div style={{ height: 280 }}>
          {data.chartData && data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.1)', padding: 12 }}
                  formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Sin datos suficientes
            </div>
          )}
        </div>
      </div>

      {/* Hourly + Top products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: '#6366f1' }} /> Ventas por hora
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.hourlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={2} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.1)' }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} style={{ color: '#6366f1' }} /> Top productos vendidos
          </h3>
          {topProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Sin ventas en este periodo</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.map((p, idx) => {
                const max = topProducts[0].count;
                const pct = (p.count / max) * 100;
                return (
                  <div key={p.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                        {idx + 1}. {p.name}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#6366f1' }}>{p.count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Zero sales */}
      <AnimatePresence>
        {data.zeroSales.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <TrendingDown size={20} style={{ color: '#ef4444' }} />
              <h3 style={{ color: '#991b1b', fontSize: '1rem', fontWeight: 800 }}>Productos sin rotación</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 12 }}>
              Sin ventas registradas en este periodo:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.zeroSales.map((p, i) => (
                <span
                  key={i}
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 10,
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: '1px solid #fecaca',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentBreakdown({ nequi, efectivo, total }: { nequi: number; efectivo: number; total: number }) {
  const pctNequi = total > 0 ? (nequi / total) * 100 : 0;
  const pctEfectivo = total > 0 ? (efectivo / total) * 100 : 0;
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wallet size={18} style={{ color: '#6366f1' }} /> Métodos de pago
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PayRow icon={<Wallet size={16} />} label="Nequi" amount={nequi} pct={pctNequi} color="#6366f1" />
        <PayRow icon={<Banknote size={16} />} label="Efectivo" amount={efectivo} pct={pctEfectivo} color="#10b981" />
      </div>
    </div>
  );
}

function PayRow({ icon, label, amount, pct, color }: { icon: React.ReactNode; label: string; amount: number; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
          <span style={{ color }}>{icon}</span> {label}
        </span>
        <span style={{ fontWeight: 800, color: '#0f172a' }}>${amount.toLocaleString('es-CO')}</span>
      </div>
      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{pct.toFixed(1)}% del total</p>
    </div>
  );
}
