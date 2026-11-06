import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

import { assertScalarAppEnvPlugin } from './assert-scalar-app-env-plugin'
import { devLocalhostCspPlugin } from './dev-localhost-csp-plugin'
import packageJson from './package.json' with { type: 'json' }

const { version: scalarAppVersion } = packageJson
const envDir = resolve('.')

export default defineConfig({
  main: {
    envDir,
    plugins: [assertScalarAppEnvPlugin(envDir)],
    resolve: {
      alias: {
        '@electron': resolve('entrypoints/electron'),
      },
    },
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        external: [/^electron(\/.*)?$/],
        output: {
          format: 'es',
        },
      },
      lib: {
        entry: resolve('entrypoints/electron/main/index.ts'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        external: [/^electron(\/.*)?$/],
        output: {
          format: 'es',
        },
      },
      lib: {
        entry: resolve('entrypoints/electron/preload/index.ts'),
      },
    },
  },
  renderer: {
    envDir,
    root: resolve('entrypoints/electron/renderer'),
    define: {
      OVERRIDE_PACKAGE_VERSION: JSON.stringify(scalarAppVersion),
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        // monaco-yaml still wraps worker initialization using Monaco's pre-0.56 protocol.
        'monaco-worker-manager/worker': 'monaco-editor/editor/editor.worker',
        '@electron': resolve('entrypoints/electron'),
        // PostHog plugin is imported from @scalar/api-client but not declared there as a runtime dep.
        // Alias it to scalar-app's dependency so pnpm + rolldown can resolve it during bundling.
        'posthog-js': resolve('node_modules/posthog-js'),
      },
      dedupe: ['vue', 'monaco-editor', 'monaco-yaml'],
    },
    plugins: [assertScalarAppEnvPlugin(envDir), vue(), tailwindcss(), devLocalhostCspPlugin()],
    optimizeDeps: {
      exclude: ['monaco-editor', 'monaco-yaml', 'monaco-worker-manager/worker'],
      // The YAML worker imports this CommonJS dependency during development.
      include: ['monaco-yaml > path-browserify'],
    },
    build: {
      minify: true,
      outDir: 'dist/renderer',
      rollupOptions: {
        input: {
          index: resolve('entrypoints/electron/renderer/index.html'),
          // Isolated realm that runs pre/post-request scripts (postman-sandbox) with its own CSP.
          sandbox: resolve('entrypoints/electron/renderer/sandbox.html'),
        },
        output: {
          format: 'es',
        },
      },
    },
  },
})
