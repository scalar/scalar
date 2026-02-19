import { build } from '@scalar/build-tooling/esbuild'

await build({
  entries: [
    'src/array/*.ts',
    'src/crypto/*.ts',
    'src/consts/*.ts',
    'src/dom/*.ts',
    'src/errors/*.ts',
    'src/file/*.ts',
    'src/number/*.ts',
    'src/general/*.ts',
    'src/http/*.ts',
    'src/node/*.ts',
    'src/object/*.ts',
    'src/regex/*.ts',
    'src/string/*.ts',
    'src/testing/*.ts',
    'src/url/*.ts',
  ],
  platform: 'shared',
  options: {
    treeShaking: true,
  },
})
