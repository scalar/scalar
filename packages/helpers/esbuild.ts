import { build } from '@scalar/build-tooling/esbuild'

build({
  entries: [
    'src/array/*.ts',
    'src/dom/*.ts',
    'src/file/*.ts',
    'src/general/*.ts',
    'src/http/*.ts',
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
