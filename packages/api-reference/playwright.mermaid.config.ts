import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: 'playwright/test/mermaid.e2e.ts',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5181' },
  webServer: {
    command: 'pnpm vite --host 127.0.0.1 --port 5181',
    url: 'http://127.0.0.1:5181/playground/mermaid/summary.html',
    reuseExistingServer: !process.env.CI,
  },
})
