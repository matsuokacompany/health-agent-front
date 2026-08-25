import type { CheckoutResponse, Subscription } from '@/lib/types';
import { api } from './api';

export const billingApi = {
  getSubscription: () => api<Subscription>('/api/billing/subscription'),
  startCheckout: () => api<CheckoutResponse>('/api/billing/subscription', { method: 'POST' }),
};
