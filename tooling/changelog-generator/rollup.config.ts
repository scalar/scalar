import { addPackageFileExports } from '@scalar/build-tooling'
import { createRollupConfig } from '@scalar/build-tooling/rollup'

const entries = ['./src/index.ts']

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries })
