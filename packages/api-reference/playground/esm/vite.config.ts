import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import packageJson from '../../package.json' with { type: 'json' }

const { version } = packageJson

export default defineConfig({
  plugins: [vue()],
  define: {
    'PACKAGE_VERSION': JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
})
