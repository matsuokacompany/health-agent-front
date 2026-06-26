'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { DailyReport, MonitoringPlan } from '@/lib/types';
import { dailyReportsApi } from '@/services/dailyReports';
import { monitoringApi } from '@/services/monitoring';

type PatientDataContextValue = {
  reports: DailyReport[];
  plans: MonitoringPlan[];
  loading: boolean;
  refresh(): Promise<void>;
  updateReport(report: DailyReport): void;
  removeReport(id: number): void;
};

const PatientDataContext = createContext<PatientDataContextValue | undefined>(undefined);

export function PatientDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [plans, setPlans] = useState<MonitoringPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nextReports, nextPlans] = await Promise.all([
        dailyReportsApi.list().catch(() => []),
        monitoringApi.listPatientPlans(Number(user.id)).catch(() => []),
      ]);
      setReports(nextReports);
      setPlans(nextPlans);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo(() => ({
    reports,
    plans,
    loading,
    refresh,
    updateReport: (report: DailyReport) => setReports((current) => current.map((item) => item.id === report.id ? report : item)),
    removeReport: (id: number) => setReports((current) => current.filter((item) => item.id !== id)),
  }), [loading, plans, refresh, reports]);

  return <PatientDataContext.Provider value={value}>{children}</PatientDataContext.Provider>;
}

export function usePatientData() {
  const context = useContext(PatientDataContext);
  if (!context) throw new Error('usePatientData must be used inside PatientDataProvider');
  return context;
}
