import { createRollupConfig, findEntryPoints } from '@scalar/build-tooling'

const config = createRollupConfig({
  options: {
    input: await findEntryPoints({}),
  },
  typescript: true,
})

export default config
