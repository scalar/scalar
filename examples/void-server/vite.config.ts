import build from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { type Plugin, defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      external: ['yaml', 'form-data', 'proxy-from-env', 'follow-redirects'],
    }) as Plugin,
    devServer({
      adapter,
      entry: 'src/index.ts',
    }) as Plugin,
  ],
  build: {
    target: 'esnext',
  },
})
