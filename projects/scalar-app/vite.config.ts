import { join, resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm'

import packageJson from './package.json' with { type: 'json' }

const { version: scalarAppVersion } = packageJson

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
      // The plugin computes its dist path with `path.join(root, outDir, base, publicPath)`,
      // which produces a broken nested path when `root` and `outDir` are absolute (as they
      // are here). Resolve it ourselves so workers land in `<outDir>/monacoeditorwork/`.
      customDistPath: (_root, outDir, _base) => join(outDir, 'monacoeditorwork'),
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
