import { createViteBuildOptions } from '@scalar/build-tooling'
import react from '@vitejs/plugin-react'
import { preserveDirective } from 'rollup-preserve-directives'
import { defineConfig } from 'vite'

export default defineConfig({
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
  }),
  plugins: [react(), preserveDirective()],
})
