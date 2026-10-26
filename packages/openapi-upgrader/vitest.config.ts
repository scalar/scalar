import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      benchmark: {
        // Built benchmark files must not run a second copy of each measurement.
        include: ['src/**/*.bench.ts'],
      },
    },
  }),
)
