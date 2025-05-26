import { URL, fileURLToPath } from 'node:url'
import { findEntryPoints } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  build: {
    ssr: true,
    minify: false,
    target: 'esnext',
    lib: {
      entry: await findEntryPoints({ allowCss: false }),
      formats: ['es'],
    },
    rollupOptions: {
      external: [...Object.keys((pkg as any).peerDependencies || {})],
      output: {
        // Create a separate file for the dependency bundle
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
})
