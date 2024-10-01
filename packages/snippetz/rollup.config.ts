import {
  addPackageFileExports,
  createRollupConfig,
  findEntryPoints,
} from '@scalar/build-tooling'

const entries = await findEntryPoints()

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries })
