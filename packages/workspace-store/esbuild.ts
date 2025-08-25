import { build } from '@scalar/build-tooling/esbuild'

const entries = [
  './src/helpers/*.ts',
  './src/schemas.ts',
  './src/client.ts',
  './src/server.ts',
  './src/schemas/*.ts',
  './src/schemas/v3.1/*.ts',
  './src/schemas/v3.1/strict/*.ts',
  './src/events/index.ts',
]

await build({
  entries,
  platform: 'node',
})
