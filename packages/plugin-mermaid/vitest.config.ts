import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// A dedicated Vitest config (rather than reusing vite.config.ts) keeps the library build settings
// out of the test run, while still compiling the `.vue` single-file components via the Vue plugin
// and providing a DOM for component mounts.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
