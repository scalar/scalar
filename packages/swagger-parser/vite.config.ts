import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/swagger-parser',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@apidevtools/swagger-parser', 'js-yaml'],
    },
  },
})
