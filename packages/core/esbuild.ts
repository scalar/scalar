import { build } from '@scalar/build-tooling/esbuild'

build({
  entries: ['src/libs/html-rendering/index.ts'],
  platform: 'shared',
  options: {
    // Ensures that `src` folder structure is kept in dist folder
    outbase: 'src',
  },
})
