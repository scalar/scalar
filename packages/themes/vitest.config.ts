import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      css: {
        /**
         * Allow vitest to actually import css files for testing
         * @see https://vitest.dev/config/#css
         */
        include: /.\/.+/,
      },
      deps: {
        web: {
          transformCss: false,
        },
      },
    },
  }),
)
