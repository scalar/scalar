import { fileURLToPath } from 'node:url'

import { findEntryPoints } from '@scalar/build-tooling'
import { ViteWatchWorkspace, alias, createViteBuildOptions } from '@scalar/build-tooling/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { createLogger } from 'vite'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

const viteLogger = createLogger()
const viteLoggerWarn = viteLogger.warn

viteLogger.warn = (msg, options) => {
  const isMonacoSourcemapWarning = msg.includes('Failed to load source map for') && msg.includes('monaco-editor')

  if (isMonacoSourcemapWarning) {
    return
  }

  viteLoggerWarn(msg, options)
}

export default defineConfig({
  customLogger: viteLogger,
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
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@scalar/*', 'monaco-editor'],
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
    alias: [
      {
        find: /^monaco-editor$/,
        replacement: __dirname + '/node_modules/monaco-editor/esm/vs/editor/editor.api',
      },
    ],
  },
})
