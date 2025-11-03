import { build } from '@scalar/build-tooling/esbuild'

const entries = [
  './src/helpers/*.ts',
  './src/schemas.ts',
  './src/client.ts',
  './src/server.ts',
  './src/schemas/*.ts',
  './src/schemas/extensions/operation/index.ts',
  './src/schemas/v3.1/strict/openapi-document.ts',
  './src/events/index.ts',
  './src/navigation/index.ts',
  './src/persistence/index.ts',
  './src/mutators/index.ts',
]

await build({
  entries,
  platform: 'node',
})
