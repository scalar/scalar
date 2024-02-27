import path from 'path'
import veauryVitePlugins from 'veaury/vite/index.js'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    veauryVitePlugins({
      type: 'react',
      // Configuration of @vitejs/plugin-vue
      // vueOptions: {...},
      // Configuration of @vitejs/plugin-react
      // reactOptions: {...},
      // Configuration of @vitejs/plugin-vue-jsx
      // vueJsxOptions: {...}
    }),
  ],
  server: {
    port: 5054,
  },
  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      // It also does not match components since we want the built version
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/*/style.css)
        find: /^@scalar\/(?!(openapi-parser|snippetz|components\/style\.css|components\b))(.+)/,
        replacement: path.resolve(__dirname, '../../packages/$2/src/index.ts'),
      },
    ],
  },
})
