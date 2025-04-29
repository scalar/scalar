import fs from 'node:fs/promises'
import { build } from '@scalar/build-tooling/esbuild'

console.log('Copying CSS files...')

await build({
  entries: 'auto',
  platform: 'shared',
  allowCss: true,
  onSuccess: async () => {
    await fs.mkdir('./dist/css')
    await fs.cp('./src/css', './dist/css', { recursive: true })
  },
})
