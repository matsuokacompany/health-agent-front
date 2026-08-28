import type { BillingPlan, CheckoutResponse, Invoice, Subscription } from '@/lib/types';
import { api } from './api';

export const billingApi = {
  getSubscription: () => api<Subscription>('/api/billing/subscription'),
  getPlans: () => api<BillingPlan[]>('/api/billing/plans'),
  getPublicPlans: (audience: 'professional' | 'patient') =>
    api<BillingPlan[]>(`/api/billing/plans/public?${new URLSearchParams({ audience })}`),
  getInvoices: () => api<Invoice[]>('/api/billing/invoices'),
  startCheckout: (planId: string) =>
    api<CheckoutResponse>('/api/billing/subscription', { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
  changePlan: (planId: string) =>
    api<CheckoutResponse>('/api/billing/subscription/change-plan', { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
  cancelSubscription: () => api<Subscription>('/api/billing/subscription/cancel', { method: 'POST' }),
  refundSubscription: () => api<Subscription>('/api/billing/subscription/refund', { method: 'POST' }),
  adminGetSubscription: (userId: number) => api<Subscription>(`/api/billing/admin/subscriptions/${userId}`),
  adminGrantTrial: (userId: number, days: number) =>
    api<Subscription>(`/api/billing/admin/subscriptions/${userId}/grant-trial`, { method: 'POST', body: JSON.stringify({ days }) }),
};
