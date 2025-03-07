import { addPackageFileExports, createRollupConfig } from '@scalar/build-tooling'

const entries = ['src/index.ts']

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries })
