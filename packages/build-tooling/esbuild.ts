import { build } from './src/esbuild'

await build({
  platform: 'node',
  entries: 'auto',
  allowCss: true,
})
