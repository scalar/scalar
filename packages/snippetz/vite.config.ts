import { alias } from '@scalar/build-tooling'
import { join } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: [
      ...Object.entries(alias(import.meta.url)).map(([find, replacement]) => ({
        find,
        replacement,
      })),
      {
        find: /~(.+)/,
        replacement: join(process.cwd(), 'node_modules/$1'),
      },
    ],
  },
})
