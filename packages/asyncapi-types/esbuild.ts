import { build } from '@scalar/build-tooling/esbuild'

build({
  entries: ['./src/index.ts', './src/types/v3.0/index.ts', './src/schemas/v3.0/index.ts'],
  platform: 'shared',
})
