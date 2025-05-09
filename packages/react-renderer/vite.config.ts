import { URL, fileURLToPath } from 'node:url'
import { createViteBuildOptions } from '@scalar/build-tooling'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

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
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
    options: {
      minify: false,
    },
  }),
})
