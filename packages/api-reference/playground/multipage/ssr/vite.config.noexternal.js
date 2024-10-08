import { defineConfig } from 'vite'

import createConfig from './vite.config.js'

export default defineConfig((env) => {
  const config = createConfig(env)
  return Object.assign(config, {
    ssr: {
      noExternal: /./,
    },
    resolve: {
      // necessary because vue.ssrUtils is only exported on cjs modules
      alias: [
        {
          find: '@vue/runtime-dom',
          replacement: '@vue/runtime-dom/dist/runtime-dom.cjs.js',
        },
        {
          find: '@vue/runtime-core',
          replacement: '@vue/runtime-core/dist/runtime-core.cjs.js',
        },
      ],
    },
    optimizeDeps: {
      exclude: ['@vitejs/test-example-external-component'],
    },
  })
})
