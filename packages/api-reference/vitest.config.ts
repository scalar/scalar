import { URL, fileURLToPath } from 'node:url'

import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: './src/vitest.setup.ts',
    },
  }),
  {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@v2': fileURLToPath(new URL('./src/v2', import.meta.url)),
        '@test': fileURLToPath(new URL('./test', import.meta.url)),
      },
    },
  },
)
