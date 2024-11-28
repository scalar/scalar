import { alias } from '@scalar/build-tooling'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: [
      {
        find: /~(.+)/,
        replacement: join(process.cwd(), 'node_modules/$1'),
      },
    ],
  },
})
