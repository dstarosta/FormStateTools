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
  entry: 'src/index.ts',
  clean: true,
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
  minify: true,
  sourcemap: 'hidden',
  treeshake: true,
});
