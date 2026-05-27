import { defineConfig } from 'tsdown';
import pluginBabel from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [
    pluginBabel({
      babelHelpers: 'bundled',
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      plugins: ['babel-plugin-react-compiler'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
  clean: false,
  deps: {
    onlyBundle: [
      'react-json-tree',
      'color',
      'color-name',
      'color-convert',
      'color-string',
      'is-arrayish',
      'simple-swizzle',
      'react-base16-styling',
    ],
  },
  dts: {
    enabled: false,
  },
  entry: {
    'form-state-tools': 'src/index.ts',
  },
  minify: {
    compress: true,
    mangle: true,
  },
  platform: 'browser',
  publint: true,
  sourcemap: 'hidden',
  target: 'es2022',
  treeshake: true,
});
