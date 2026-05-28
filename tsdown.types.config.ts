import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'form-state-tools': 'src/index.ts',
    client: 'src/plugin/client.ts',
    runtime: 'src/plugin/runtime.tsx',
  },
  checks: {
    pluginTimings: false,
  },
  clean: true,
  dts: {
    emitDtsOnly: true,
    sourcemap: true,
  },
  platform: 'neutral',
});
