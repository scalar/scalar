import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/base.css',
          dest: './',
        },
        {
          src: 'src/fonts.css',
          dest: './',
        },
        {
          src: 'src/scrollbar.css',
          dest: './',
        },
        {
          src: 'src/presets',
          dest: './',
        },
        {
          src: 'src/fonts',
          dest: './',
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/themes',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
    },
    // Don't minify CSS so we can use it in stuff like the theme editor
    cssMinify: false,
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
