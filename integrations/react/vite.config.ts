import react from '@vitejs/plugin-react'
import { createViteBuildOptions } from '@scalar/build-tooling'
import preserveDirective from 'rollup-preserve-directives'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), preserveDirective()],
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
  }),
})
