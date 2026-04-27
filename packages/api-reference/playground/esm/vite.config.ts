import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { version } from '../../package.json'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.SCALAR_API_REFERENCE_VERSION': JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
})
