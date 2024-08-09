import { createRollupConfig, findEntryPoints } from '@scalar/build-tooling'

export default createRollupConfig({
  typescript: true,
  options: {
    input: await findEntryPoints({ allowCss: false }),
  },
})
