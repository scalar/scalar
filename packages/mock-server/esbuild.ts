import { build } from '@scalar/build-tooling/esbuild'

build({
  entries: ['./src/index.ts'],
  platform: 'shared',
})
