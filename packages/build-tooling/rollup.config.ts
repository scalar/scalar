import type { RollupOptions } from 'rollup'

import { createRollupConfig } from './src/build-options'

const options: RollupOptions = {
  input: './src/index.ts',
  ...createRollupConfig({ typescript: true }),
}

export default options
