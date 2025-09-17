import { build } from '@scalar/build-tooling/esbuild'

const entries = ['./src/index.ts', './src/2.0-to-3.0/index.ts', './src/3.0-to-3.1/index.ts']

build({
  entries,
  platform: 'shared',
  allowJs: true,
})
