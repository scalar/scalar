import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { playgroundApi } from './server'

export default defineConfig({
  plugins: [vue(), tailwindcss(), playgroundApi()],
  server: { port: 3000 },
})
