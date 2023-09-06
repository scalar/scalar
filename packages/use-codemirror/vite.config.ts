import vue from '@vitejs/plugin-vue'
import path from 'path'
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

  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/*/style.css)
        find: /^@scalar\/([^/]+)$/,
        replacement: path.resolve(__dirname, '../$1/src/index.ts'),
      },
    ],
  },
})
