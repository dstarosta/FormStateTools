import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  clean: true,
  dts: {
    enabled: false,
  },
  inlineOnly: [
    'react-json-tree',
    'color',
    'color-name',
    'color-convert',
    'color-string',
    'is-arrayish',
    'simple-swizzle',
    'react-base16-styling',
  ],
  minify: true,
  sourcemap: 'hidden',
  treeshake: true,
});
