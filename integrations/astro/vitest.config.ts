import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    setupFiles: ['./vitest.setup.ts'],
  },
})
