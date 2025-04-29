import { build } from '@scalar/build-tooling/esbuild'

const entries = ['./src/index.ts', './src/plugins/fetch-urls/index.ts', './src/plugins/read-files/index.ts']

build({
  entries,
  platform: 'shared',
})
