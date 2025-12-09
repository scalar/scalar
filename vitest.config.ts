import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['integrations/*', 'packages/*', 'projects/*'],
  },
})
