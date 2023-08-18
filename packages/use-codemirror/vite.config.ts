import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/use-codemirror',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@codemirror/lang-javascript',
        '@codemirror/lang-json',
        '@codemirror/state',
        '@codemirror/view',
        '@uiw/codemirror-theme-duotone',
        '@uiw/codemirror-themes',
        'codemirror',
      ],
    },
  },
})
