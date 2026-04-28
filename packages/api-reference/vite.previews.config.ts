import { resolve } from 'node:path'

import apiReferenceConfig from './vite.config'

export default {
  ...apiReferenceConfig,
  root: resolve(import.meta.dirname, '.'),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}
