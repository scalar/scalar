import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm'

import { scalarAppMonacoEditorPluginOptions } from './monaco-vite-plugin-options'
import packageJson from './package.json' with { type: 'json' }

const { version: scalarAppVersion } = packageJson

export default defineConfig({
  main: {
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
    root: resolve('entrypoints/electron/renderer'),
    define: {
      OVERRIDE_PACKAGE_VERSION: JSON.stringify(scalarAppVersion),
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@electron': resolve('entrypoints/electron'),
        // PostHog plugin is imported from @scalar/api-client but not declared there as a runtime dep.
        // Alias it to scalar-app's dependency so pnpm + rolldown can resolve it during bundling.
        'posthog-js': resolve('node_modules/posthog-js'),
      },
      dedupe: ['vue', 'monaco-editor', 'monaco-yaml'],
    },
    plugins: [vue(), tailwindcss(), monacoEditorPlugin(scalarAppMonacoEditorPluginOptions)],
    optimizeDeps: {
      exclude: ['monaco-editor', 'monaco-yaml'],
    },
    build: {
      minify: true,
      outDir: 'dist/renderer',
      rollupOptions: {
        input: resolve('entrypoints/electron/renderer/index.html'),
        output: {
          format: 'es',
        },
      },
    },
  },
})
