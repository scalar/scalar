import vue from '@vitejs/plugin-vue'
// import { builtinModules } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // build: {
  //   rollupOptions: {
  //     external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
  //   },
  // },
  // resolve: {
  //   alias: [
  //     // Resolve the uncompiled source code for all @scalar packages
  //     // It’s working with the alias, too. It’s just required to enable HMR.
  //     // It also does not match components since we want the built version
  //     {
  //       // Resolve the uncompiled source code for @scalar/openapi-parser packages
  //       find: '@scalar/openapi-parser',
  //       replacement: path.resolve(
  //         __dirname,
  //         // '../packages/openapi-parser/dist/index.js',
  //         '../packages/openapi-parser/src/index.ts',
  //       ),
  //     },
  //   ],
  // },
})
