import react from '@vitejs/plugin-react'
import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
  }),
})
