import type { AdminSystemHealth } from '@/services/adminReporting';

// A scheduled send goes out once a day, so still not having sent one in 36h
// while there are active plans to send to is the clearest sign something
// stopped firing -- any real failures in the last 24h are just as telling.
export function isAppHealthy(health: AdminSystemHealth) {
  if (health.failed_messages_last_24h > 0) return false;
  if (health.active_monitoring_plans > 0) {
    const hoursSinceOutbound = health.last_outbound_message_at ? (Date.now() - new Date(health.last_outbound_message_at).getTime()) / (1000 * 60 * 60) : Infinity;
    if (hoursSinceOutbound > 36) return false;
  }
  return true;
}
