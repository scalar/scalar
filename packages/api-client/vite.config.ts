import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

/**
 * Automatic css injection via js
 * We need the setTimeout so we can do a quick check to see if the css file has already been loaded
 */
const injectCodeFunction = (cssCode: string) => {
  const STYLE_ID = 'scalar-style-api-client'
  try {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID))
      return

    setTimeout(() => {
      getComputedStyle(document.body).getPropertyValue('--scalar-loaded')

      const elementStyle = document.createElement('style')
      elementStyle.setAttribute('id', STYLE_ID)
      elementStyle.appendChild(document.createTextNode(cssCode))
      document.head.appendChild(elementStyle)
    }, 0)
  } catch (e) {
    console.error('vite-plugin-css-injected-by-js', e)
  }
}

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
        {
          name: 'pack-css',
          generateBundle(opts, bundle) {
            console.log('generating bundle')
            console.log({ bundle })
            const { ['style.css']: style, ['index.js']: component } = bundle

            const IIFEcss = `
            (function() {
              try {
setTimeout(() => {console.log(getComputedStyle(document.body).getPropertyValue('--scalar-loaded'))},0)

              } catch(error) {
                console.error(error, 'unable to concat style inside the bundled file')
              }
            })()`

            //               const IIFEcss = `
            // (function() {
            //   try {
            //       var elementStyle = document.createElement('style');
            //       elementStyle.innerText = ${JSON.stringify(rawCss)}
            //       document.head.appendChild(elementStyle)
            //   } catch(error) {
            //     console.error(error, 'unable to concat style inside the bundled file')
            //   }
            // })()`

            component.code += IIFEcss
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
