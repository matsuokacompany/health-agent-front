import { describe, expect, it } from 'vitest';
import { isAppHealthy } from '@/lib/adminSystemHealth';
import type { AdminSystemHealth } from '@/services/adminReporting';

function health(overrides: Partial<AdminSystemHealth> = {}): AdminSystemHealth {
  return {
    checked_at: new Date().toISOString(),
    last_inbound_message_at: new Date().toISOString(),
    last_outbound_message_at: new Date().toISOString(),
    processed_messages_last_24h: 10,
    failed_messages_last_24h: 0,
    active_monitoring_plans: 3,
    ...overrides,
  };
}

describe('isAppHealthy', () => {
  it('está saudável sem falhas e com envio recente', () => {
    expect(isAppHealthy(health())).toBe(true);
  });

  it('fica não saudável quando há falhas nas últimas 24h', () => {
    expect(isAppHealthy(health({ failed_messages_last_24h: 1 }))).toBe(false);
  });

  it('fica não saudável quando há planos ativos mas nenhum envio há mais de 36h', () => {
    const staleOutbound = new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString();
    expect(isAppHealthy(health({ last_outbound_message_at: staleOutbound }))).toBe(false);
  });

  it('fica não saudável quando há planos ativos mas nunca houve envio', () => {
    expect(isAppHealthy(health({ last_outbound_message_at: null }))).toBe(false);
  });

  it('permanece saudável sem envio recente quando não há planos ativos (nada para enviar)', () => {
    expect(isAppHealthy(health({ last_outbound_message_at: null, active_monitoring_plans: 0 }))).toBe(true);
  });
});
