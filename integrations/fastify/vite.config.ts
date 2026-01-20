import { alias } from '@scalar/build-tooling/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: alias(import.meta.url),
  },
  test: {
    /**
     * Mock the getJavaScriptFile module during tests.
     * The actual scalar.js file is only created during build (via copy:standalone),
     * but we don't need the real content for testing the plugin logic.
     */
    alias: {
      './utils/get-javascript-file': new URL('./src/utils/__mocks__/get-javascript-file.ts', import.meta.url).pathname,
    },
  },
})
