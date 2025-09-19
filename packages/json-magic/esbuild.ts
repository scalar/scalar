import { build } from '@scalar/build-tooling/esbuild'

await build({
  platform: 'shared',
  entries: [
    'src/bundle/index.ts',
    'src/bundle/bundle-local-refs.ts',
    'src/magic-proxy/index.ts',
    'src/diff/index.ts',
    'src/dereference/index.ts',
    'src/bundle/plugins/node.ts',
    'src/bundle/plugins/browser.ts',
    'src/helpers/escape-json-pointer.ts',
  ],
})
