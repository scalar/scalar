import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vitest/config'

/** Simple vite config to build the tailwind styles */
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: './dist',
    lib: {
      formats: ['es'],
      entry: ['src/tailwind.css'],
    },
    cssCodeSplit: true,
    emptyOutDir: false,
  },
})
