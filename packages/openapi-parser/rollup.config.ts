import { addPackageFileExports, createRollupConfig } from '@scalar/build-tooling'

const entries = ['./src/index.ts', './src/plugins/fetch-urls/index.ts', './src/plugins/read-files/index.ts']

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries })
