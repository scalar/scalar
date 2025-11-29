import fs from 'node:fs/promises'

import { build } from '@scalar/build-tooling/esbuild'

await build({
  entries: 'auto',
  platform: 'shared',
  allowCss: true,
  onSuccess: async () => {
    console.log('Copying CSS files...')
    await fs.mkdir('./dist/css')
    await fs.cp('./src/css', './dist/css', { recursive: true })
    console.log('CSS files copy completed')
  },
})
