import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

const STYLE_ID = 'scalar-style-api-reference'
const STYLE_LOADED_VAR = '--scalar-loaded-api-reference'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [vue()],
  build: {
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/api-reference',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vue',
        ...Object.keys(pkg.dependencies || {}).filter((item) =>
          item.match(/^(?!@scalar\/(?!components\b)).*/),
        ),
      ],
      plugins: [
        /**
         * Automatic css injection via js
         * We need the setTimeout so we can do a quick check to see if the css file has already been loaded
         *
         * @see https://stackoverflow.com/a/68954980/1624255
         *
         * TODO make this into a rollup/vite plugin
         *
         * copied from client/vite.config
         */
        {
          name: 'autoload-css',
          generateBundle(_, bundle) {
            if (!('source' in bundle['style.css'])) return

            const {
              ['style.css']: { source: css },
            } = bundle

            const IIFEcss = `
              (function() {
                try {
                  if (typeof document === 'undefined' || document.getElementById('${STYLE_ID}'))
                    return

                  setTimeout(() => {
                    if (getComputedStyle(document.body).getPropertyValue('${STYLE_LOADED_VAR}') === 'true') return 

                    const elementStyle = document.createElement('style')
                    elementStyle.setAttribute('id', '${STYLE_ID}')
                    elementStyle.appendChild(document.createTextNode(${JSON.stringify(css)}))
                    document.head.appendChild(elementStyle)

                    console.warn('Auto-loading the css through js has been deprecated. Please import the css directly. Visit https://github.com/scalar/scalar for more info.')
                  }, 0)

                } catch (error) {
                  console.error(error, 'unable to concat style inside the bundled file')
                }
              })()`

            const component =
              bundle['index.js'] || bundle['index.cjs'] || bundle['index.mjs']
            if ('code' in component) component.code += IIFEcss
          },
        },
      ],
    },
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
        find: /^@scalar\/(?!(openapi-parser|snippetz|galaxy|themes\/style.css|components\/style\.css|components\b))(.+)/,
        replacement: path.resolve(__dirname, '../$2/src/index.ts'),
      },
    ],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
