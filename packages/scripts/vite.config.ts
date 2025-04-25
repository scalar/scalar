import { URL, fileURLToPath } from 'node:url'
import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [vue(), svgLoader()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
    options: {
      ssr: false,
    },
  }),
})
