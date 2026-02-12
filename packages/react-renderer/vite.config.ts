import { alias, createViteBuildOptions } from '@scalar/build-tooling/vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), react()],
  resolve: {
    alias: alias(import.meta.url),
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
