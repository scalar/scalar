import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    cssCodeSplit: true,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/use-codemirror',
      fileName: 'index',
      formats: ['es'],
    },
  },
})
