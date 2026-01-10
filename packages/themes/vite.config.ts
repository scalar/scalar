import { createViteBuildOptions } from '@scalar/build-tooling/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    ...createViteBuildOptions({
      entry: ['src/index.ts', 'src/tailwind.css', 'src/style.css', 'src/fonts/fonts.css'],
    }),
    cssCodeSplit: true,
    // We don't want to minify the CSS. We need beautiful output for our theme editor.
    cssMinify: false,
    minify: false,
  },
  test: {},
})
