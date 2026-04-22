import StatsClient from './StatsClient';

export const dynamic = 'force-dynamic';

export default function StatsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--accent-blue)' }}>📊 Estadísticas y Reportes</h1>
      <StatsClient />
    </div>
  );
}
