import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { configDefaults } from 'vitest/config'

import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
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
    }),
  ],
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/*'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})
