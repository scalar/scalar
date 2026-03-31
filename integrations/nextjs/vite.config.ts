import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: '@scalar/nextjs-api-reference',
      formats: ['es', 'cjs', 'umd'],
      fileName: 'index',
    },
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/index.ts'),
      },
      external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)],
      output: {
        exports: 'named',
        globals: {
          'react': 'React',
          'react-dom': 'react-dom',
          'next/script': 'Script',
        },
      },
    },
  },
  plugins: [react(), dts({ insertTypesEntry: true, rollupTypes: true })],
})
