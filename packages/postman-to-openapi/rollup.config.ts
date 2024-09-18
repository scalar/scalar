import { createRollupConfig } from '@scalar/build-tooling'
import type { RollupOptions } from 'rollup'

const options: RollupOptions = {
  input: ['./src/index.ts'],
  ...createRollupConfig({
    // Needed to enable explicit TypeScript (which Vite does not need)
    typescript: true,
  }),
}

export default options
