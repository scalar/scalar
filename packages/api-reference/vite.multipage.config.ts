import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: './playground/multipage',
  plugins: [vue()],
  resolve: {
    dedupe: ['vue'],
  },
})
