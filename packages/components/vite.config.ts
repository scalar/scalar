import { URL, fileURLToPath } from 'node:url'

import { createViteBuildOptions } from '@scalar/build-tooling/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { PluginOption } from 'vite'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    tailwindcss(),
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
    }) as PluginOption,
  ],
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
  }),
})
