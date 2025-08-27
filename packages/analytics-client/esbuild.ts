import { build } from '@scalar/build-tooling/esbuild'

await build({
  platform: 'shared',
  entries: ['./src/index.ts'],
})
