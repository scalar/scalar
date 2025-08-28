import { defineConfig } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: 'test/**/*.e2e.ts',
  workers: '100%',
})
