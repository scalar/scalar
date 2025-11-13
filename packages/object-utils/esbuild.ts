import { build } from '@scalar/build-tooling/esbuild'

build({
  entries: [
    './src/arrays/index.ts',
    './src/clone/index.ts',
    './src/merge/index.ts',
    './src/mutator-record/index.ts',
    './src/nested/index.ts',
    './src/parse/index.ts',
    './src/transforms/index.ts',
  ],
  platform: 'shared',
})
