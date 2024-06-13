import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
})
