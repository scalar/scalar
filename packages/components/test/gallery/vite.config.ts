import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { type PluginOption, defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

const packageRoot = resolve(import.meta.dirname, '../..')

/**
 * Dev server for the component gallery that hosts Playwright's `mount()` fixture.
 *
 * Vite serves any HTML file under its root, so the gallery needs no build of its own: Playwright's
 * `baseURL` points straight at `/test/gallery/index.html` and Vite compiles it on demand. The root
 * is the package rather than this folder so that path resolves, and so Tailwind scans the same
 * sources it would in the library build.
 *
 * This is separate from the package's `vite.config.ts` because that one is a library build, and the
 * `vue` alias below would follow it into the published output.
 */
export default defineConfig({
  root: packageRoot,
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
  optimizeDeps: {
    /**
     * Crawl the gallery and every story up front.
     *
     * Vite otherwise discovers dependencies as modules are imported, and re-optimizing mid-run
     * triggers a full page reload that destroys the execution context `mount()` is evaluating in.
     * Listing the stories is what makes that discovery happen once, at startup.
     *
     * The entries also have to be explicit because the default scan globs every HTML file under the
     * root, which picks up `storybook-static/` and fails to parse it.
     */
    entries: ['test/gallery/index.html', 'src/**/*.stories.ts'],
  },
  server: {
    // Sits next to Storybook's 5100 rather than replacing it — Storybook keeps its workbench role
    port: 5101,
    strictPort: true,
    // The dockerized browser reaches the host through this name
    allowedHosts: ['host.docker.internal', '127.0.0.1', 'localhost'],
  },
})
