import { ViteWatchWorkspace, alias, createViteBuildOptions } from '@scalar/build-tooling'

import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [vue(), tailwindcss(), svgLoader(), ViteWatchWorkspace()],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: alias(import.meta.url),
    dedupe: ['vue'],
  },
  optimizeDeps: {
    exclude: ['@scalar/*'],
  },
  server: {
    port: 5065,
    /**
     * We proxy requests to void.scalar.com to test same-domain cookies.
     */
    proxy: {
      '/void': 'https://void.scalar.com',
    },
  },
  build: createViteBuildOptions({
    entry: [
      'src/index.ts',
      'src/views/Request/types/index.ts',
      'src/views/Request/libs/index.ts',
      'src/views/Request/consts/index.ts',
      'src/views/Request/components/index.ts',
      'src/views/Request/ResponseSection/index.ts',
      'src/views/Request/RequestSection/index.ts',
      'src/views/Request/RequestSection/RequestAuth/index.ts',
      'src/views/Components/CodeSnippet/index.ts',
      'src/types/index.ts',
      'src/store/index.ts',
      'src/libs/index.ts',
      'src/libs/send-request/index.ts',
      'src/libs/importers/index.ts',
      'src/layouts/Web/index.ts',
      'src/layouts/Modal/index.ts',
      'src/layouts/App/index.ts',
      'src/hooks/index.ts',
      'src/components/index.ts',
      'src/components/ViewLayout/index.ts',
      'src/components/Sidebar/index.ts',
      'src/components/Server/index.ts',
      'src/components/ImportCollection/index.ts',
      'src/components/HttpMethod/index.ts',
      'src/components/DataTable/index.ts',
      'src/components/CommandPalette/index.ts',
      'src/components/CodeInput/index.ts',
      'src/components/AddressBar/index.ts',
    ],
    options: {
      ssr: false,
    },
  }),
  test: {
    environment: 'jsdom',
    setupFiles: './src/vitest.setup.ts',
  },
})
