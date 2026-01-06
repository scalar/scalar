import { alias, createViteBuildOptions } from '@scalar/build-tooling/vite'
import vue from '@vitejs/plugin-vue'
import { type BuildEnvironmentOptions, defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: alias(import.meta.url),
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
  build: createViteBuildOptions<BuildEnvironmentOptions>({
    entry: [
      'src/index.ts',
      'src/libs/execute-scripts/index.ts',
      'src/libs/execute-scripts/context/postman-scripts/index.ts',
      'src/plugins/post-response-scripts/index.ts',
      'src/plugins/post-response-scripts/components/PostResponseScripts/index.ts',
      'src/plugins/post-response-scripts/components/TestResults/index.ts',
    ],
    options: {
      ssr: false,
    },
  }),
})
