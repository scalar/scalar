import react from '@vitejs/plugin-react'
import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: './src/index.ts',
      name: '@scalar/api-reference-react',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    minify: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts'),
      },
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['react', 'react-dom'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        exports: 'named',
        globals: {
          'react': 'React',
          'react-dom': 'react-dom',
        },
      },
    },
  },
  resolve: {
    /**
     * This is part of a temporary hack to allow this component to be used during
     * SSR in next/docusaurus etc
     * TODO remove this when we can point to the correct version of this by targeting server
     */
    alias: {
      'decode-named-character-reference':
        './node_modules/decode-named-character-reference/index.js',
    },
  },
  plugins: [react(), dts({ insertTypesEntry: true, rollupTypes: true })],
})
