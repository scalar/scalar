import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { loadConfigFromFile, mergeConfig } from 'electron-vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const aliases = {
  '@electron': resolve('entrypoints/electron'),
  '@web': resolve('entrypoints/web/src'),
  '@': resolve('src'),
  // Ensure tests can resolve posthog-js from @scalar/api-client plugin imports.
  'posthog-js': resolve('node_modules/posthog-js'),
}

const externalizeElectronPlugin = (): Plugin => ({
  name: 'vitest:externalize-electron',
  enforce: 'pre',
  resolveId(source) {
    if (source === 'electron' || source.startsWith('electron/')) {
      return {
        external: true,
        id: source,
      }
    }
  },
})

export default defineConfig(async ({ command, mode }) => {
  const electronViteConfig = await loadConfigFromFile({
    command,
    mode,
  })
  const electronMainConfig = electronViteConfig?.config.main ?? {}

  const electronProject = mergeConfig(electronMainConfig, {
    plugins: [externalizeElectronPlugin()],
    resolve: {
      alias: aliases,
    },
    ssr: {
      external: ['electron', /^electron\/.+/],
    },
    test: {
      environment: 'node',
      include: ['entrypoints/electron/**/*.test.ts'],
      name: 'electron',
    },
  })

  return {
    test: {
      projects: [
        {
          plugins: [vue()],
          resolve: {
            alias: aliases,
          },
          test: {
            environment: 'jsdom',
            exclude: ['**/node_modules/**', '**/dist/**', '**/tmp/**', 'entrypoints/electron/**/*.test.ts'],
            include: ['src/**/*.test.ts', 'entrypoints/web/**/*.test.ts'],
            name: 'vite',
            alias: [
              {
                find: /^monaco-editor$/,
                replacement: `${import.meta.dirname}/node_modules/monaco-editor/esm/vs/editor/editor.api`,
              },
            ],
            server: {
              deps: {
                // Force vite-node to transform @scalar/api-client so the posthog alias applies.
                inline: ['@scalar/api-client', 'posthog-js'],
              },
            },
          },
        },
        electronProject,
      ],
    },
  }
})
