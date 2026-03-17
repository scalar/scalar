import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

import { createExternalsFromPackageJson, createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config'

const require = createRequire(import.meta.url)
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default

const external = createExternalsFromPackageJson()
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

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
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@v2': resolve(import.meta.dirname, './src/v2'),
      '@test': resolve(import.meta.dirname, './test'),
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
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      cssFileName: 'style',
      entry,
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      external,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/vitest.setup.ts',
    alias: [
      {
        find: /^monaco-editor$/,
        replacement: resolve(import.meta.dirname, 'node_modules/monaco-editor/esm/vs/editor/editor.api'),
      },
    ],
  },
})
