import { resolve } from 'node:path'

import apiReferenceConfig from './api-reference/vite.config'

export default {
  ...apiReferenceConfig,
  root: resolve(import.meta.dirname, './api-reference'),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}
