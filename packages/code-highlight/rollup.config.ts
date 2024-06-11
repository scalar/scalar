import { createRollupConfig, findEntryPoints } from '@scalar/build-tooling'
import type { RollupOptions } from 'rollup'

const options: RollupOptions = {
  input: await findEntryPoints({ allowCss: true }),
  ...createRollupConfig({
    typescript: true,
    copy: [{ src: './src/css', dest: 'dist' }],
  }),
}

export default options
