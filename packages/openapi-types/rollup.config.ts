import { createRollupConfig, findEntryPoints } from '@mintlify/build-tooling'

export default createRollupConfig({
  typescript: true,
  options: {
    input: await findEntryPoints({ allowCss: false }),
  },
})
