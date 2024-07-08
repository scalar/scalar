import build from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      external: ['yaml', 'form-data', 'proxy-from-env', 'follow-redirects'],
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx',
    }),
  ],
  build: {
    target: 'esnext',
  },
})
