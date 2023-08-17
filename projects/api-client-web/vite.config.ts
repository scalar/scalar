import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      exclude: [
        'fs', // Excludes the polyfill for `fs` and `node:fs`.
      ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  server: {
    port: 5050,
  },
  resolve: {
    // alias: [
    //   {
    //     // Resolve the uncompiled source code for all @scalar packages
    //     // @scalar/* -> packages/*/
    //     find: /^@scalar\/(.*)$/,
    //     replacement: path.resolve(__dirname, '../../packages/$1/src/index.ts'),
    //   },
    // ],
  },
})
