import { createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { readdirSync } from 'fs'
import { defineConfig } from 'vitest/config'

/**
 * All the preset files in the `src/presets` directory.
 */
const presets = readdirSync('src/presets').map(
  (fileName) => `src/presets/${fileName}`,
)

export default defineConfig({
  plugins: [vue()],
  build: {
    ...createViteBuildOptions({
      entry: ['src/index.ts', 'src/tailwind.ts', 'src/style.css', ...presets],
      options: { lib: { formats: ['es', 'cjs'] } },
    }),
    cssCodeSplit: true,
    // We don’t want to minify the CSS. We need beautiful output for our theme editor.
    cssMinify: false,
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
    /**
     * Allow vitest to actually import CSS files for testing
     * @see https://vitest.dev/config/#css
     */
    css: {
      include: /.\/.+/,
    },
    deps: {
      web: {
        transformCss: false,
      },
    },
  },
})
