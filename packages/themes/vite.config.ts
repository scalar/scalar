import { createViteBuildOptions } from '@scalar/build-tooling/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    ...createViteBuildOptions({
      entry: ['src/index.ts', 'src/tailwind.css', 'src/style.css', 'src/fonts/fonts.css'],
    }),
    cssCodeSplit: true,
    // We don't want to minify the CSS. We need beautiful output for our theme editor.
    cssMinify: false,
    minify: false,
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
