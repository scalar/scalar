import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default
const { version: scalarAppVersion } = require('./package.json')

export default defineConfig({
  root: resolve('entrypoints/web'),
  envDir: resolve('.'),
  define: {
    OVERRIDE_PACKAGE_VERSION: JSON.stringify(scalarAppVersion),
  },
  resolve: {
    alias: {
      '@': resolve('src'),
      '@web': resolve('entrypoints/web/src'),
      // Temporary until @scalar/api-client declares posthog-js as a runtime dependency.
      'posthog-js': resolve('node_modules/posthog-js'),
    },
    dedupe: ['vue', 'monaco-editor', 'monaco-yaml'],
  },
  optimizeDeps: {
    exclude: ['monaco-editor', 'monaco-yaml'],
  },
  publicDir: resolve('public-web'),
  plugins: [
    vue(),
    tailwindcss(),
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
  build: {
    outDir: resolve('dist/web'),
    rolldownOptions: {
      input: resolve('entrypoints/web/index.html'),
    },
  },
  server: {
    port: 5065,
  },
})
