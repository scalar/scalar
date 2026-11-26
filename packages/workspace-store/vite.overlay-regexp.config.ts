import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Include the patched matcher so npm consumers get the same limits as the monorepo.
    outDir: 'dist/helpers',
    emptyOutDir: false,
    license: { fileName: 'overlay-regexp.LICENSE.md' },
    lib: {
      entry: 'src/helpers/overlay-regexp.ts',
      formats: ['es'],
      fileName: () => 'overlay-regexp.js',
    },
  },
})
