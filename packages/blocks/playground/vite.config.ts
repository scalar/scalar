import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue(), tailwindcss()],
  define: {
    PACKAGE_VERSION: JSON.stringify('0.0.0'),
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, '../src'),
    },
  },
})
