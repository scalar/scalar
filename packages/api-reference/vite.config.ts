import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
  plugins: [vue(), topLevelAwait()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts', 'src/assets/css/variables.css'],
      name: '@scalar/api-reference',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'xmldom', 'rehype-document', 'rehype-format', 'rehype-sanitize', 'rehype-stringify', 'remark-gfm', 'remark-parse', 'remark-rehype', 'remark-textr', 'typographic-base', 'unified', '@scalar/swagger-editor'],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'style.css'
          }

          return assetInfo.name ?? 'default'
        },
      },
    },
  },
})
