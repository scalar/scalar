import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5050,
  },
  resolve: {
    alias: [
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        find: /^@scalar\/(.*)$/,
        replacement: path.resolve(__dirname, '../../packages/$1/src/index.ts'),
      },
    ],
  },
  plugins: [vue()],
})
