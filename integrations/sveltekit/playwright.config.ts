import { defineConfig } from '@playwright/test'

const fixture = process.env.SVELTEKIT_FIXTURE ?? './playwright/fixture'

export default defineConfig({
  testDir: './playwright/test',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5079' },
  webServer: {
    command: 'npm exec -- vite preview --host 127.0.0.1 --port 5079 --strictPort',
    cwd: fixture,
    url: 'http://127.0.0.1:5079',
    reuseExistingServer: false,
  },
})
