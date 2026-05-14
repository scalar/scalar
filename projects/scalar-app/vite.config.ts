import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm'

import { devLocalhostCspPlugin } from './dev-localhost-csp-plugin'
import { scalarAppMonacoEditorPluginOptions } from './monaco-vite-plugin-options'
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
  plugins: [vue(), tailwindcss(), monacoEditorPlugin(scalarAppMonacoEditorPluginOptions), devLocalhostCspPlugin()],
  build: {
    outDir: resolve('dist/web'),
    rolldownOptions: {
      input: resolve('entrypoints/web/index.html'),
    },
  },
  server: {
    port: 5065,
    // E2E: browsers in Docker hit the host Vite server with this Host header (see playwright.config baseURL).
    allowedHosts: ['host.docker.internal'],
  },
})
