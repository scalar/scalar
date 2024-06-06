import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
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
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies),
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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
