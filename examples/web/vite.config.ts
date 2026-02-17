import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5050,
    open: true,
  },
})
