import { fileURLToPath } from 'node:url'

import { alias, createViteBuildOptions } from '@scalar/build-tooling/vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { type Plugin, defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: alias(import.meta.url),
  },
  plugins: [
    vue(),
    // Ensure the viewBox is preserved
    svgLoader({
      svgoConfig: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // @see https://github.com/svg/svgo/issues/1128
                removeViewBox: false,
              },
            },
          },
        ],
      },
    }) as Plugin,
  ],
  build: createViteBuildOptions({
    entry: ['src/index.ts', 'src/library/index.ts', 'src/types.ts'],
  }),
  test: {
    environment: 'jsdom',
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})
