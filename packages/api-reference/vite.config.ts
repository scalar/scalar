import { URL, fileURLToPath } from 'node:url'

import { createViteBuildOptions } from '@scalar/build-tooling/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { version } from './package.json'

const entries = ['src/index.ts', 'src/components/index.ts', 'src/helpers/index.ts']

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
  },
  server: {
    // Enable host binding in dev containers for proper port forwarding
    // See: https://vite.dev/guide/troubleshooting.html#dev-containers-vs-code-port-forwarding
    ...(process.env.REMOTE_CONTAINERS && { host: '127.0.0.1' }),
    allowedHosts: ['localhost', 'host.docker.internal'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  build: createViteBuildOptions({
    entry: entries,
    options: {
      minify: false,
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        plugins: [],
      },
    },
  }),
})
