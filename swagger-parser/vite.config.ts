// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: './src/wasm-swagger-parser/dist/json.wasm',
          dest: './wasm',
        },
        {
          src: './src/wasm-swagger-parser/dist/wasm_exec.js',
          dest: './wasm',
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'SwaggerParser',
      fileName: 'swagger-parser',
      formats: ['es', 'umd'],
    },
  },
})
