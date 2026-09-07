import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright/test',
  use: { baseURL: 'http://127.0.0.1:5090', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start -- --port 5090',
    url: 'http://127.0.0.1:5090/openapi.json',
    reuseExistingServer: false,
  },
})
