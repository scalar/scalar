import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { createExternalsFromPackageJson, createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

export default defineConfig({
  plugins: [vue(), react()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
    dedupe: ['vue', 'react', 'react-dom'],
  },
  server: {
    port: 9000,
  },
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
      external,
    },
  },
})
