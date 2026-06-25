import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'e2e/**'],
    coverage: { provider: 'v8', include: ['lib/**', 'services/**', 'infrastructure/**'], exclude: ['lib/supabase.ts', 'lib/mockData.ts', 'lib/types.ts'], thresholds: { lines: 50, branches: 50, functions: 50, statements: 50 } },
  },
  resolve: { alias: { '@': '/workspace/health-agent-front' } },
});
