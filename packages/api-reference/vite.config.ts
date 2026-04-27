import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
  findEntryPoints,
} from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': '"production"',
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
