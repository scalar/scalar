import { build } from '@scalar/build-tooling/esbuild'

const entries = ['./src/schemas.ts', './src/client.ts', './src/server.ts']

await build({
  entries,
  platform: 'node',
})
