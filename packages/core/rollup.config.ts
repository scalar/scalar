import { addPackageFileExports } from '@scalar/build-tooling'
import { createRollupConfig } from '@scalar/build-tooling/rollup'

const entries = [
  // empty
  'src/index.ts',
  // libs
  'src/libs/html-rendering/index.ts',
]

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries, allowCss: false })
