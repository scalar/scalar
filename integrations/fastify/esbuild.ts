import { build } from '@scalar/build-tooling/esbuild'

const entries = ['src/index.ts']

build({
  entries,
  platform: 'node',
})
