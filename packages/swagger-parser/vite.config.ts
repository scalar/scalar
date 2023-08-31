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
      /**
       * Make sure to also externalize any dependencies that you do not want to bundle into your library
       */
      external: ['@apidevtools/swagger-parser', 'js-yaml'],
    },
  },
})
