import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins:[react()], test:{ environment:'jsdom', coverage:{ provider:'v8', thresholds:{ lines:70, branches:70, functions:70, statements:70 } } }, resolve:{ alias:{ '@':'/workspace/health-agent-front' } } });
