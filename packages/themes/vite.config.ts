import { createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { readdirSync } from 'fs'
import { defineConfig } from 'vitest/config'

// Grab all presets
const presets = readdirSync('src/presets').map(
  (fileName) => `src/presets/${fileName}`,
)

export default defineConfig({
  plugins: [vue()],
  build: {
    ...createViteBuildOptions({
      entry: ['src/index.ts', 'src/style.css', ...presets],
    }),
    cssCodeSplit: true,
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
