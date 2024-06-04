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
        ...Object.keys(pkg.peerDependencies),
        ...Object.keys(pkg.dependencies),
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

                  console.warn('Auto-loading the client css through js has been deprecated. Please import the css directly. Visit https://github.com/scalar/scalar for more info.')
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
  resolve: {},
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
