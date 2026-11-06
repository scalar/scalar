import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { assertScalarAppEnvPlugin } from './assert-scalar-app-env-plugin'
import { devLocalhostCspPlugin } from './dev-localhost-csp-plugin'
import packageJson from './package.json' with { type: 'json' }

const { version: scalarAppVersion } = packageJson
const envDir = resolve('.')

export default defineConfig({
  root: resolve('entrypoints/web'),
  envDir,
  define: {
    OVERRIDE_PACKAGE_VERSION: JSON.stringify(scalarAppVersion),
  },
  resolve: {
    alias: {
      '@': resolve('src'),
      // monaco-yaml still wraps worker initialization using Monaco's pre-0.56 protocol.
      'monaco-worker-manager/worker': 'monaco-editor/editor/editor.worker',
      '@web': resolve('entrypoints/web/src'),
      // Temporary until @scalar/api-client declares posthog-js as a runtime dependency.
      'posthog-js': resolve('node_modules/posthog-js'),
    },
    dedupe: ['vue', 'monaco-editor', 'monaco-yaml'],
  },
  optimizeDeps: {
    exclude: ['monaco-editor', 'monaco-yaml', 'monaco-worker-manager/worker'],
    // The YAML worker imports this CommonJS dependency during development.
    include: ['monaco-yaml > path-browserify'],
  },
  publicDir: resolve('public-web'),
  plugins: [assertScalarAppEnvPlugin(envDir), vue(), tailwindcss(), devLocalhostCspPlugin()],
  build: {
    outDir: resolve('dist/web'),
    rolldownOptions: {
      input: {
        index: resolve('entrypoints/web/index.html'),
        // Isolated realm that runs pre/post-request scripts (postman-sandbox) with its own CSP.
        sandbox: resolve('entrypoints/web/sandbox.html'),
      },
    },
  },
  server: {
    port: 5065,
    // E2E: browsers in Docker hit the host Vite server with this Host header (see playwright.config baseURL).
    allowedHosts: ['host.docker.internal'],
  },
  preview: {
    // E2E pre-builds the app and serves it with `vite preview`; browsers in Docker reach it with
    // this Host header (see playwright.config baseURL), so it must be allowed here too.
    allowedHosts: ['host.docker.internal'],
  },
})
