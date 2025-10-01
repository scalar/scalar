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
      input: {
        extension: './src/extension.ts',
        'scalar-api-reference': './src/scalar-api-reference.js',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    sourcemap: true,
    outDir: 'dist',
  },
  plugins: [],
})
