import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

const require = createRequire(import.meta.url)
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default

/**
 * App-mode build for the api-client playgrounds. The main `vite.config.ts` is
 * configured for library output, which is incompatible with bundling a deployable
 * playground. Pass the playground folder as Vite's root, e.g.
 *   vite build playground/app -c vite.playground.config.ts
 */
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    svgLoader(),
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
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version || '0.0.0'),
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@v2': resolve(import.meta.dirname, './src/v2'),
      '@test': resolve(import.meta.dirname, './test'),
    },
    dedupe: ['vue', 'monaco-editor', 'monaco-yaml'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
})
