import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import standalone from './vite.standalone.config'

/** Reuse the standalone bundle settings, keeping all CSS inside the custom element. */
export default defineConfig({
  ...standalone,
  plugins: [vue({ customElement: true }), tailwindcss()],
  build: {
    ...standalone.build,
    outDir: 'dist/webComponent',
    lib: {
      entry: 'src/webComponent/component.ts',
      name: 'ScalarApiReferenceElement',
      formats: ['iife'],
    },
  },
})
