import { addPackageFileExports, createRollupConfig } from './src/index.js'

const entries = ['./src/index.ts']

export default createRollupConfig({
  options: {
    input: entries,
    external: ['url', 'fs/promises'],
  },
  typescript: true,
})

await addPackageFileExports({ entries })
