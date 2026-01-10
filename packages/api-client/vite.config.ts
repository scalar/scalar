import { fileURLToPath } from 'node:url'

import { findEntryPoints } from '@scalar/build-tooling'
import { ViteWatchWorkspace, alias, createViteBuildOptions } from '@scalar/build-tooling/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss(), svgLoader(), ViteWatchWorkspace()],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      ...alias(import.meta.url),
      '@v2': fileURLToPath(new URL('./src/v2', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  optimizeDeps: {
    exclude: ['@scalar/*'],
  },
  server: {
    port: 5065,
    /**
     * We proxy requests to void.scalar.com to test same-domain cookies.
     */
    proxy: {
      '/void': 'https://void.scalar.com',
    },
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
    options: {
      ssr: false,
    },
  }),
  test: {
    environment: 'jsdom',
    setupFiles: './test/vitest.setup.ts',
  },
})
