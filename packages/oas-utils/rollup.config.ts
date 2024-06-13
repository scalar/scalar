import { createRollupConfig, findTsEntryPoints } from '@scalar/build-tooling'

export default createRollupConfig({
  typescript: true,
  options: {
    input: await findTsEntryPoints(),
  },
})
