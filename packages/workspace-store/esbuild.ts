import { build } from '@scalar/build-tooling/esbuild'

const entries = [
  './src/helpers/*.ts',
  './src/schemas.ts',
  './src/client.ts',
  './src/server.ts',
  './src/schemas/*.ts',
  './src/schemas/extensions/operation/index.ts',
  './src/schemas/extensions/security/index.ts',
  './src/schemas/extensions/workspace/index.ts',
  './src/schemas/v3.1/strict/openapi-document.ts',
  './src/schemas/v3.1/strict/type-guards.ts',
  './src/events/index.ts',
  './src/navigation/index.ts',
  './src/persistence/index.ts',
  './src/mutators/index.ts',
  './src/plugins/bundler/index.ts',
  './src/plugins/client/index.ts',
  './src/workspace-plugin.ts',
  './src/entities/history/*.ts',
  './src/entities/auth/index.ts',
  './src/resolve.ts',
]

await build({
  entries,
  platform: 'node',
})
