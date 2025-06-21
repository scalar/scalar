import { build } from '@scalar/build-tooling/esbuild'

const entries = [
  './src/schemas.ts',
  './src/client.ts',
  './src/server.ts',
  './src/schemas/v3.1/*.ts',
  './src/schemas/v3.1/strict/*.ts',
]

await build({
  entries,
  platform: 'node',
})
