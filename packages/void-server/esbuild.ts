import { build } from '@scalar/build-tooling/esbuild'

await build({
  platform: 'node',
  entries: ['src/index.ts'],
})
