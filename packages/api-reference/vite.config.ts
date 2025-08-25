import { URL, fileURLToPath } from 'node:url'
import { autoCSSInject, createViteBuildOptions } from '@scalar/build-tooling'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { version } from './package.json'

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
      '@v2': fileURLToPath(new URL('./src/v2', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
    options: {
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        plugins: [autoCSSInject('references')],
      },
    },
  }),
})
