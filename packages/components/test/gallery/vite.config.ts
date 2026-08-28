import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { type PluginOption, defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

const packageRoot = resolve(import.meta.dirname, '../..')

/**
 * Vite config for the component gallery that hosts Playwright's `mount()` fixture.
 *
 * The plugins mirror the package's own `vite.config.ts` so a story renders the same here as it does
 * in the library build, and the port sits next to Storybook's 5100 rather than replacing it —
 * Storybook keeps its workbench role.
 */
export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@': resolve(packageRoot, './src'),
      '@test': resolve(packageRoot, './test'),
      /**
       * Nearly every story renders through a `template` string, which the runtime-only build cannot
       * compile. Storybook ships the same alias from its `storybook:vue-template-compilation`
       * plugin, so without it the gallery renders blank pages where Storybook renders components.
       */
      'vue': 'vue/dist/vue.esm-bundler.js',
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
  build: {
    outDir: resolve(packageRoot, './gallery-static'),
    emptyOutDir: true,
  },
  server: {
    port: 5101,
    strictPort: true,
  },
  preview: {
    port: 5101,
    strictPort: true,
    allowedHosts: ['host.docker.internal', '127.0.0.1', 'localhost'],
  },
})
