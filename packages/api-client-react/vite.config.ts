import react from '@vitejs/plugin-react'
import { preserveDirective } from 'rollup-preserve-directives'
import { defineConfig } from 'vite'

import { createExternalsFromPackageJson, createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

export default defineConfig({
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
  plugins: [react(), preserveDirective()],
})
