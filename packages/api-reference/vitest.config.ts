import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      setupFiles: './src/vitest.setup.ts',
      environment: 'jsdom',
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
