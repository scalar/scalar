import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { findEntryPoints } from '@scalar/build-tooling'
import { ViteWatchWorkspace, alias, createViteBuildOptions } from '@scalar/build-tooling/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    svgLoader(),
    ViteWatchWorkspace(),
    monacoEditorPlugin({
      languageWorkers: ['json', 'editorWorkerService'],
      customWorkers: [
        {
          label: 'yaml',
          entry: 'monaco-yaml/yaml.worker',
        },
      ],
    }),
  ],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      ...alias(import.meta.url),
      '@v2': fileURLToPath(new URL('./src/v2', import.meta.url)),
    },
    dedupe: ['vue', 'monaco-editor', 'monaco-yaml'],
  },
  optimizeDeps: {
    exclude: ['@scalar/*', 'monaco-editor', 'monaco-yaml'],
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
