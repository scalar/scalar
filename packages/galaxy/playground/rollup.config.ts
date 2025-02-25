import { createRollupConfig } from '@scalar/build-tooling'

const input = ['./src/index.ts']

// Do not use the findEntryPoints helper - it will overwrite the static file outputs
export default createRollupConfig({
  typescript: true,
  options: {
    input: input,
  },
})
