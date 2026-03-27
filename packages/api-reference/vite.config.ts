import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
} from '../../tooling/scripts/vite-lib-config'
import { version } from './package.json'

const external = createExternalsFromPackageJson()

const entries = [
  './src/index.ts',
  './src/ssr.ts',
  './src/components/index.ts',
  './src/blocks/index.ts',
  './src/hooks/index.ts',
  './src/plugins/index.ts',
  './src/features/index.ts',
  './src/helpers/index.ts',
  './src/ssr.ts',
]

const entry = createLibEntry(entries, import.meta.dirname)

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
  },
  server: {
    // Enable host binding in dev containers for proper port forwarding
    // See: https://vite.dev/guide/troubleshooting.html#dev-containers-vs-code-port-forwarding
    ...(process.env.REMOTE_CONTAINERS && { host: '127.0.0.1' }),
    allowedHosts: ['localhost', 'host.docker.internal'],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@test': resolve(import.meta.dirname, './test'),
    },
    dedupe: ['vue'],
  },
  build: {
    outDir: './dist',
    minify: false,
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      cssFileName: 'style',
      entry,
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      external,
      output: createPreserveModulesOutput(),
    },
  },
})
