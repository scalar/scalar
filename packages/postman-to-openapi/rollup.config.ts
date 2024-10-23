import { createRollupConfig } from '@scalar/build-tooling'

const config = createRollupConfig({
  options: {
    input: ['src/index.ts'],
  },
  typescript: true,
})

export default config
