import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.ssr.test.ts', 'src/**/cva.test.ts'],
        },
      },
      {
        // Existing Vue Test Utils fixtures use inline templates.
        resolve: {
          alias: [{ find: /^vue$/, replacement: 'vue/dist/vue.esm-browser.js' }],
        },
        test: {
          name: 'browser',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.ssr.test.ts', 'src/**/cva.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
