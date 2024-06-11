import { addPackageFileExports, createRollupConfig } from './src'

const entries = ['./src/index.ts']

export default createRollupConfig({
  options: {
    input: entries,
  },
  typescript: true,
})

await addPackageFileExports({ entries })
