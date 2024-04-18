import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      css: {
        include: /.\/fixtures\/.+/,
      },
      deps: {
        web: {
          transformCss: false,
        },
      },
    },
  }),
)
