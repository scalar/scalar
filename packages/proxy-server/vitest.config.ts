import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        main: './src/proxy-worker.ts',
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
})
