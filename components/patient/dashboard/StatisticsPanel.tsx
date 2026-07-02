'use client';

import { useState } from 'react';
import { usePatientDashboardStatistics } from '@/hooks/usePatientDashboard';
import type { DashboardPeriod } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';

export function Chart({ title, data }: { title: string; data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <div className="patient-chart"><strong>{title}</strong>{data.map((item) => <div className="patient-chart-row" key={item.label}><span>{item.label}</span><i style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} /><b>{item.value}</b></div>)}</div>;
}

export function StatisticsPanel() {
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const params = { period, from: period === 'custom' ? custom.from : undefined, to: period === 'custom' ? custom.to : undefined };
  const { data, isLoading, isFetching } = usePatientDashboardStatistics(params);
  return <DashboardSection title="Estatísticas" eyebrow="Indicadores" loading={isLoading} className={`patient-statistics-panel ${isFetching && !isLoading ? 'is-updating' : ''}`} skeletonLines={5}>
    <div className="patient-filter-grid compact"><label>Período<select value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="90d">90 dias</option><option value="1y">1 ano</option><option value="custom">Personalizado</option></select></label>{period === 'custom' ? <><label>De<input type="date" value={custom.from} onChange={(event) => setCustom((current) => ({ ...current, from: event.target.value }))} /></label><label>Até<input type="date" value={custom.to} onChange={(event) => setCustom((current) => ({ ...current, to: event.target.value }))} /></label></> : null}</div>
    <div className="patient-summary-grid">{(data?.cards ?? []).map((card) => <div key={card.label}><strong>{card.value}</strong><span>{card.label}</span></div>)}</div>
    <div className="patient-charts-grid">{(data?.charts ?? []).map((chart) => <Chart key={chart.id} title={chart.title} data={chart.data} />)}</div>
  </DashboardSection>;
}
