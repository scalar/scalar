import path from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '../src'),
    },
  },
  define: {
    __REGISTRY_URL__: JSON.stringify('http://127.0.0.1:3080'),
    __VECTOR_URL__: JSON.stringify('http://localhost:9999'),
  },
  publicDir: '../public',
  server: {
    port: 9200,
  },
})
