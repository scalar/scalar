import { URL, fileURLToPath } from 'node:url'

import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: './src/vitest.setup.ts',
      alias: [
        {
          find: /^monaco-editor$/,
          replacement: __dirname + '/node_modules/monaco-editor/esm/vs/editor/editor.api',
        },
      ],
    },
  }),
)
