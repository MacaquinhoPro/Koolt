"use client";

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Calendar, DollarSign, Wallet, Banknote, ShoppingCart, Tag, Award, TrendingDown } from 'lucide-react';
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
    const wsData = [
      { Metrica: "Filtro", Valor: filter },
      ...(filter === 'custom' && fromDate && toDate ? [{ Metrica: "Desde", Valor: format(fromDate, 'yyyy-MM-dd') }, { Metrica: "Hasta", Valor: format(toDate, 'yyyy-MM-dd') }] : []),
      { Metrica: "Pedidos Totales", Valor: data.ordersCount },
      { Metrica: "Productos Vendidos", Valor: data.totalItemsSold },
      { Metrica: "Ingresos Totales", Valor: "$" + data.totalEarned.toLocaleString() },
      { Metrica: "Ganancia Neta (60%)", Valor: "$" + data.netProfit.toLocaleString() },
      { Metrica: "Ventas Nequi", Valor: "$" + data.earnedNequi.toLocaleString() },
      { Metrica: "Ventas Efectivo", Valor: "$" + data.earnedEfectivo.toLocaleString() },
      { Metrica: "Producto Más Vendido", Valor: data.topSeller },
      { Metrica: "Productos Sin Ventas", Valor: data.zeroSales.length > 0 ? data.zeroSales.join(', ') : 'Ninguno' },
    ];

    wsData.push({ Metrica: "", Valor: "" });
    wsData.push({ Metrica: "--- UNIDADES VENDIDAS POR PRODUCTO ---", Valor: "" });
    Object.entries(data.productSales || {}).forEach(([pName, count]) => {
      if (count > 0) {
        wsData.push({ Metrica: pName, Valor: count });
      }
    });
    
    // Add timeseries data to excel
    wsData.push({ Metrica: "", Valor: "" });
    wsData.push({ Metrica: "--- DETALLE POR DÍA ---", Valor: "" });
    data.chartData.forEach(d => {
      wsData.push({ Metrica: d.date, Valor: '$' + d.amount.toLocaleString() });
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estadisticas");
    XLSX.writeFile(wb, `Reporte_Koolt_${filter}.xlsx`);
  };

  if (loading && !data) return <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Cargando estadísticas...</div>;
  if (!data) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      
      {/* Filters and Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Calendar size={20} color="var(--text-secondary)" />
            <span style={{ fontWeight: '500' }}>Rango de Tiempo:</span>
            <CustomSelect 
              value={filter}
              onChange={(val) => setFilter(val)}
              options={[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Última Semana' },
                { value: 'month', label: 'Último Mes' },
                { value: '3months', label: 'Últimos 3 Meses' },
                { value: 'all', label: 'Historico (Todo)' },
                { value: 'custom', label: 'Personalizado' },
              ]}
              style={{ width: '200px' }}
            />
          </div>

          {filter === 'custom' && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <DatePicker
                selected={fromDate}
                onChange={(date: Date | null) => setFromDate(date)}
                selectsStart
                startDate={fromDate}
                endDate={toDate}
                locale="es"
                dateFormat="dd/MM/yyyy"
                placeholderText="Fecha de inicio"
                className="date-picker-input"
              />
              <span style={{ color: 'var(--text-secondary)' }}>hasta</span>
              <DatePicker
                selected={toDate}
                onChange={(date: Date | null) => setToDate(date)}
                selectsEnd
                startDate={fromDate}
                endDate={toDate}
                minDate={fromDate || undefined}
                locale="es"
                dateFormat="dd/MM/yyyy"
                placeholderText="Fecha de fin"
                className="date-picker-input"
              />
              <button className="btn btn-primary" onClick={fetchStats} disabled={!fromDate || !toDate} style={{ padding: '0.6rem 1rem' }}>
                Aplicar
              </button>
            </div>
          )}
        </div>
        
        <button className="btn btn-success" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={18} /> Exportar
        </button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
      >
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-lt-blue)', padding: '1rem', borderRadius: '50%' }}>
            <DollarSign size={32} color="var(--accent-blue)" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Ingresos Totales</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>${data.totalEarned.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '50%' }}>
            <DollarSign size={32} color="#10b981" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Ganancia Neta (60%)</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>${data.netProfit.toLocaleString()}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid #6f42c1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '50%' }}>
            <Wallet size={32} color="#6f42c1" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Ganancia Nequi</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>${data.earnedNequi.toLocaleString()}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid var(--success-green)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '50%' }}>
            <Banknote size={32} color="var(--success-green)" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Ganancia Efectivo</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>${data.earnedEfectivo.toLocaleString()}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '50%' }}>
            <ShoppingCart size={32} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Pedidos</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{data.ordersCount}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid #ec4899', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fce7f3', padding: '1rem', borderRadius: '50%' }}>
            <Tag size={32} color="#ec4899" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Productos Vendidos</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{data.totalItemsSold}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '4px solid #14b8a6', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#ccfbf1', padding: '1rem', borderRadius: '50%' }}>
            <Award size={32} color="#14b8a6" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Mejor Producto</h3>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>{data.topSeller}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}
      >
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Evolución de Ventas</h3>
        {data.chartData && data.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickMargin={10} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <Tooltip 
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Ventas']} 
                labelStyle={{ color: 'var(--text-primary)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            No hay datos suficientes para graficar en este periodo.
          </div>
        )}
      </motion.div>

      {/* Worst sellers block */}
      <AnimatePresence>
        {data.zeroSales.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="card" style={{ borderLeft: '4px solid var(--danger-red)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ background: '#fee2e2', padding: '0.8rem', borderRadius: '50%' }}>
              <TrendingDown size={24} color="var(--danger-red)" />
            </div>
            <div>
              <h3 style={{ color: 'var(--danger-red)', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600' }}>Productos sin ventas</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {data.zeroSales.join(', ')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
