import { createRollupConfig, addPackageFileExports } from '@scalar/build-tooling'

const entries = ['src/index.ts']
var rollup_config = createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})
await addPackageFileExports({ entries })

export { rollup_config as default }
