import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/api-client',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@codemirror/lang-java',
        '@codemirror/lang-javascript',
        '@codemirror/lang-json',
        '@codemirror/lang-python',
        '@codemirror/language',
        '@codemirror/legacy-modes',
        '@codemirror/state',
        '@codemirror/view',
        '@scalar/use-codemirror',
        '@uiw/codemirror-theme-duotone',
        '@uiw/codemirror-themes',
        'codemirror',
      ],
    },
  },
})
