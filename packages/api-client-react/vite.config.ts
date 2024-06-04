import react from '@vitejs/plugin-react'
import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: './src/index.ts',
      name: '@scalar/api-client-react',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts'),
      },
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies),
      ],
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
  plugins: [react(), dts({ insertTypesEntry: true, rollupTypes: true })],
})
