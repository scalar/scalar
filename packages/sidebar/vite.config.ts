import { URL, fileURLToPath } from 'node:url'

import { createViteBuildOptions } from '@scalar/build-tooling/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    tailwindcss(),
  ],
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
  }),
})
