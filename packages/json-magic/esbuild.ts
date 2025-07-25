import { build } from '@scalar/build-tooling/esbuild'

await build({
  platform: 'shared',
  entries: ['src/bundle', 'src/magic-proxy', 'src/bundle/plugins/node', 'src/bundle/plugins/browser'],
})
