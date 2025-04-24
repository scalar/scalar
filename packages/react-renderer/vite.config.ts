import { URL, fileURLToPath } from 'node:url'
import { findEntryPoints } from '@scalar/build-tooling'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import pkg from './package.json'

export default defineConfig({
  plugins: [vue(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue', 'react', 'react-dom'],
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
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
})
