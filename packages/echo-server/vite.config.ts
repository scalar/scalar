import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/echo-server',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['cookie-parser', 'cors', 'express'],
    },
  },
})
