'use client';

import { useEffect, useState } from 'react';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { notificationsApi } from '@/services/notifications';
import { redFlagCategoryLabel } from '@/lib/redFlagCategories';
import type { AppNotification } from '@/lib/types';

const MONITORING_STATUS_WINDOW_DAYS = 30;
// Matches the longest window among ORANGE_COMBINATION_RULES on the backend
// (app/services/red_flag_symptoms.py) -- a laranja notification older than
// this is outside the pattern's own detection window and shouldn't still
// read as "current" on this standing indicator.
const ORANGE_STATUS_WINDOW_DAYS = 21;

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Standing red/orange/green safety indicator, derived from the patient's
 * own reports plus any recent orange-tier notification. Lives in the app
 * header (patient portal only) rather than a dashboard-only card, so it
 * stays visible no matter which page the patient is on. */
export function MonitoringStatusIndicator() {
  const { reports } = usePatientData();
  const [orangeNotice, setOrangeNotice] = useState<AppNotification | null>(null);

  useEffect(() => {
    let mounted = true;
    const windowStartMs = Date.now() - ORANGE_STATUS_WINDOW_DAYS * 86_400_000;
    notificationsApi.list()
      .then((result) => {
        if (!mounted) return;
        const match = result.items.find(
          (item) => item.kind === 'SYMPTOM_CLUSTER_ALERT' && new Date(item.created_at).getTime() >= windowStartMs,
        );
        setOrangeNotice(match ?? null);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const windowStart = dateKey(new Date(Date.now() - (MONITORING_STATUS_WINDOW_DAYS - 1) * 86_400_000));
  const latestRed = reports
    .filter((report) => report.red_flag_category && String(report.report_date ?? '').slice(0, 10) >= windowStart)
    .sort((a, b) => String(b.report_date ?? '').localeCompare(String(a.report_date ?? '')))[0];

  // Priority vermelho > laranja > verde -- a possible emergency always
  // takes the badge over a "worth a short-term evaluation" pattern.
  const className = latestRed
    ? 'patient-monitoring-badge has-alert'
    : orangeNotice
      ? 'patient-monitoring-badge has-orange-alert'
      : 'patient-monitoring-badge';

  const headline = latestRed ? '🔴 Sinal de alerta identificado' : orangeNotice ? '🟠 Padrão de sinais em observação' : '🟢 Sem sinais de alerta';
  const detail = latestRed
    ? `${redFlagCategoryLabel(latestRed.red_flag_category!)} — ${formatDate(latestRed.report_date)}`
    : orangeNotice
      ? orangeNotice.message
      : `Nenhum sinal de alerta identificado nos últimos ${MONITORING_STATUS_WINDOW_DAYS} dias.`;

  return (
    <span className={className} data-tour="patient-monitoring-status" title={detail}>
      <span className="patient-monitoring-badge-headline">{headline}</span>
      <span className="patient-monitoring-badge-detail muted compact">{detail}</span>
    </span>
  );
}
