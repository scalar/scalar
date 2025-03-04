import { addPackageFileExports, createRollupConfig } from '@scalar/build-tooling'

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
