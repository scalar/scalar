import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './src/extension.ts',
      formats: ['cjs'],
      fileName: 'extension',
    },
    rollupOptions: {
      external: ['vscode'],
    },
    sourcemap: true,
    outDir: 'dist',
  },
  plugins: [],
})
