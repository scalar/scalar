import { createRollupConfig } from '@scalar/build-tooling'
import type { RollupOptions } from 'rollup'

const options: RollupOptions = {
  input: ['./src/index.ts', './src/spawn-test.ts'],
  ...createRollupConfig({
    typescript: true,
    options: {
      treeshake: false,
    },
  }),
}

export default options
