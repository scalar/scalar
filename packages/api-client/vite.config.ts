import {
  ViteWatchWorkspace,
  createViteBuildOptions,
  findEntryPoints,
} from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [vue(), svgLoader(), ViteWatchWorkspace()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  optimizeDeps: {
    exclude: ['@scalar/*'],
  },
  server: {
    port: 5065,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
    options: {
      ssr: false,
    },
  }),
})
