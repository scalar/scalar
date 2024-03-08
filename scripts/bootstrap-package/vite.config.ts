import { findEntryPoints } from '@scalar/build-tooling'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import pkg from './package.json'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
  build: {
    ssr: true,
    minify: false,
    target: 'esnext',
    lib: {
      entry: await findEntryPoints({ allowCss: true }),
      formats: ['es'],
    },
    rollupOptions: {
      external: [...Object.keys((pkg as any).peerDependencies || {})],
      output: {
        // Create a separate file for the dependency bundle
        manualChunks: (id) =>
          id.includes('node_modules') ? 'vendor' : undefined,
      },
    },
  },
})
