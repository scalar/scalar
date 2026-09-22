import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright/test',
  use: { baseURL: 'http://127.0.0.1:5078', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm exec next start playwright/fixture -p 5078',
    url: 'http://127.0.0.1:5078/openapi.json',
    reuseExistingServer: false,
  },
})
