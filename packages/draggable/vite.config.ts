import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

export default defineConfig({
  plugins: [vue(), dts({ insertTypesEntry: true, rollupTypes: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 5064,
  },
  build: {
    ssr: false,
    target: 'esnext',
    lib: {
      name: '@scalar/draggable',
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [...Object.keys((pkg as any).peerDependencies || {})],
      input: {
        main: path.resolve(__dirname, 'src/index.ts'),
      },
    },
  },
})
