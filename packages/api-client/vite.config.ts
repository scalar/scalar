import { ViteWatchWorkspace, alias, createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'

import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [vue(), tailwindcss(), svgLoader(), ViteWatchWorkspace()],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: alias(import.meta.url),
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
    setupFiles: './src/vitest.setup.ts',
  },
})
