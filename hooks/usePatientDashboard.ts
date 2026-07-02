'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { patientDashboardApi, type CheckInsParams, type HistoryParams, type StatisticsParams, type PatientDashboardOverview, type PatientDashboardCalendar, type PaginatedResponse, type DashboardCheckIn, type PatientDashboardStatistics } from '@/services/patientDashboard';

export function usePatientDashboardOverview() {
  return useQuery<PatientDashboardOverview>({ queryKey: ['patient-dashboard', 'overview'], queryFn: patientDashboardApi.getOverview, staleTime: 120_000 });
}

export function usePatientDashboardCalendar(year: number, month: number) {
  return useQuery<PatientDashboardCalendar>({ queryKey: ['patient-dashboard', 'calendar', year, month], queryFn: () => patientDashboardApi.getCalendar(year, month), placeholderData: keepPreviousData, staleTime: 300_000 });
}

export function usePatientDashboardHistory(params: HistoryParams) {
  const key = useMemo(() => ['patient-dashboard', 'history', params] as const, [params]);
  return useQuery<PaginatedResponse<DashboardCheckIn>>({ queryKey: key, queryFn: () => patientDashboardApi.getHistory(params), placeholderData: keepPreviousData, staleTime: 60_000 });
}

export function usePatientDashboardStatistics(params: StatisticsParams) {
  const key = useMemo(() => ['patient-dashboard', 'statistics', params] as const, [params]);
  return useQuery<PatientDashboardStatistics>({ queryKey: key, queryFn: () => patientDashboardApi.getStatistics(params), placeholderData: keepPreviousData, staleTime: 120_000 });
}

export function usePatientDashboardCheckIns(params: CheckInsParams) {
  const key = useMemo(() => ['patient-dashboard', 'checkins', params] as const, [params]);
  return useQuery<PaginatedResponse<DashboardCheckIn>>({ queryKey: key, queryFn: () => patientDashboardApi.getCheckIns(params), placeholderData: keepPreviousData, staleTime: 30_000 });
}
