import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

// import scopeTailwind from 'vite-plugin-scope-tailwind'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: './src/index.ts',
      name: '@scalar/components',
      formats: ['es', 'cjs', 'umd'],
      fileName: 'index',
      // the proper extensions will be added
      // fileName: 'my-lib',
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts'),
      },
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: Object.keys(pkg.dependencies || {}),
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    // scopeTailwind(),
    dts({ insertTypesEntry: true, tsconfigPath: 'tsconfig.build.json' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
