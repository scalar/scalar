import { build } from '@scalar/build-tooling/esbuild'

await build({
  entries: ['./src/index.ts'],
  platform: 'shared',
})
