import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
  findEntryPoints,
} from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

export default defineConfig({
  plugins: [vue(), tailwindcss(), svgLoader()],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@v2': resolve(import.meta.dirname, './src/v2'),
      '@test': resolve(import.meta.dirname, './test'),
    },
    dedupe: ['vue'],
  },
  optimizeDeps: {
    // posthog-js ships a pre-bundled dist/module.js — excluding it prevents Vite from
    // crawling its transitive @opentelemetry/otlp-exporter-base dep, which imports the
    // Node.js 'stream' and 'zlib' built-ins and triggers a browser-externalization warning.
    exclude: ['@scalar/*', 'posthog-js'],
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
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      cssFileName: 'vue-styles',
      entry,
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      external,
      output: createPreserveModulesOutput(),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/vitest.setup.ts',
  },
})
