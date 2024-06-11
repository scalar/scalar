import { createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/*.css',
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
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
  }),
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
