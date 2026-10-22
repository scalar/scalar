import { resolve } from 'node:path'

import apiReferenceConfig from './vite.config'

export default {
  ...apiReferenceConfig,
  root: resolve(import.meta.dirname, '.'),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: ['index.html', 'header.html', 'embedded.html', 'path-routing.html', 'layout-theme.html'].map(
        (page): string => resolve(import.meta.dirname, page),
      ),
    },
  },
}
