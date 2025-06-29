import { mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(viteConfig, {
  test: {
    environment: 'jsdom',
    coverage: {
      include: ['src/**'],
      exclude: ['node_modules', 'dist', 'test', '**/*.preview.ts'],
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
})
