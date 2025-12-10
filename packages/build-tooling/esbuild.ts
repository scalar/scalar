import { build } from './src/esbuild'

await build({
  platform: 'node',
  entries: ['./src/index.ts', './src/esbuild/index.ts', './src/vite/index.ts'],
  allowCss: false,
})
