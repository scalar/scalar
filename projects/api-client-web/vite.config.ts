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
        find: '@scalar/api-client',
        replacement: path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      },
    ],
  },
  plugins: [vue()],
})
