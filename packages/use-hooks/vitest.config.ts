import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {},
  test: {
    environment: 'jsdom',
  },
})
