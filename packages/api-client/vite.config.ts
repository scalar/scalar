import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

const STYLE_ID = 'scalar-style-api-client'
const STYLE_LOADED_VAR = '--scalar-loaded-api-client'

export default defineConfig({
  plugins: [vue()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/api-client',
      formats: ['es'],
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
         * copied from api-reference/vite.config
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
    //   alias: [
    //     // Resolve the uncompiled source code for all @scalar packages
    //     // It’s working with the alias, too. It’s just required to enable HMR.
    //     // It also does not match components since we want the built version
    //     {
    //       // Resolve the uncompiled source code for all @scalar packages
    //       // @scalar/* -> packages/*/
    //       // (not @scalar/*/style.css)
    //       find: /^@scalar\/(?!(openapi-parser|snippetz|galaxy|components\/style\.css|components\b))(.+)/,
    //       replacement: path.resolve(__dirname, '../$2/src/index.ts'),
    //     },
    //   ],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
