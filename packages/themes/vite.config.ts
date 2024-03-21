import vue from '@vitejs/plugin-vue'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    libInjectCss(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/base.css',
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
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
