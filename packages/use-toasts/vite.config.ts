import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { createExternalsFromPackageJson, createLibEntry } from '../../tooling/scripts/vite-lib-config.ts'

const external = createExternalsFromPackageJson()
const entry = createLibEntry(['./src/index.ts'], import.meta.dirname)

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      cssFileName: 'style',
      entry,
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      // Inline the client stylesheet so server rendering does not import CSS through Node.
      external: (id) => id !== 'vue-sonner/style.css?inline' && external.some((pattern) => pattern.test(id)),
    },
  },
})
