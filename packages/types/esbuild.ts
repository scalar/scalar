import { build } from '@scalar/build-tooling/esbuild'

await build({
  entries: [
    './src/index.ts',
    './src/api-reference/index.ts',
    './src/entities/index.ts',
    './src/legacy/index.ts',
    './src/snippetz/index.ts',
    './src/utils/index.ts',
  ],
  platform: 'shared',
})
