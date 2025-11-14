import { build } from '@scalar/build-tooling/esbuild'

build({
  entries: [
    './src/index.ts',
    './src/api/index.ts',
    './src/entities/index.ts',
    './src/legacy/index.ts',
    './src/snippetz/index.ts',
    './src/utils/index.ts',
  ],
  platform: 'shared',
})
