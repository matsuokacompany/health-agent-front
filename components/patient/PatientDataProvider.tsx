'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { DailyReport, MonitoringPlan } from '@/lib/types';
import { dailyReportsApi } from '@/services/dailyReports';
import { monitoringApi } from '@/services/monitoring';

type PatientDataBundle = { reports: DailyReport[]; plans: MonitoringPlan[] };

const patientDataCache = new Map<string, PatientDataBundle>();
const patientDataRequests = new Map<string, Promise<PatientDataBundle>>();

type PatientDataContextValue = {
  reports: DailyReport[];
  plans: MonitoringPlan[];
  loading: boolean;
  refresh(force?: boolean): Promise<void>;
  updateReport(report: DailyReport): void;
  removeReport(id: number): void;
};

const PatientDataContext = createContext<PatientDataContextValue | undefined>(undefined);

export function PatientDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [plans, setPlans] = useState<MonitoringPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (force = false) => {
    if (!user) {
      setReports([]);
      setPlans([]);
      setLoading(false);
      return;
    }

    const cacheKey = String(user.id);
    const cached = patientDataCache.get(cacheKey);
    if (cached && !force) {
      setReports(cached.reports);
      setPlans(cached.plans);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let request = force ? undefined : patientDataRequests.get(cacheKey);
      if (!request) {
        request = Promise.all([
          dailyReportsApi.list().catch(() => []),
          monitoringApi.listCurrentPatientPlans().catch(() => []),
        ]).then(([nextReports, nextPlans]) => ({ reports: nextReports, plans: nextPlans }));
        patientDataRequests.set(cacheKey, request);
      }

      const nextData = await request;
      patientDataCache.set(cacheKey, nextData);
      setReports(nextData.reports);
      setPlans(nextData.plans);
    } finally {
      patientDataRequests.delete(cacheKey);
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
