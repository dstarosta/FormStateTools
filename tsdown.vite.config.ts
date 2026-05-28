import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: false,
  dts: {
    enabled: true,
    sourcemap: true,
  },
  entry: {
    vite: 'src/plugin/vite.ts',
  },
  format: ['es'],
  outExtensions: () => ({ js: '.js' }),
  deps: {
    neverBundle: ['vite'],
  },
  minify: {
    compress: true,
    mangle: true,
  },
  platform: 'node',
  publint: true,
  sourcemap: 'hidden',
  target: 'node20',
  treeshake: true,
});
