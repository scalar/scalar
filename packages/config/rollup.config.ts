import {
  addPackageFileExports,
  createRollupConfig,
} from '@scalar/build-tooling'

const entries = ['./src/index.ts']

export default createRollupConfig({
  options: {
    input: entries,
    external: [
      'node:fs',
      'ajv/dist/2020',
      'ajv-draft-04',
      'ajv-formats',
      'url',
      'fs',
    ],
  },
  typescript: true,
})

await addPackageFileExports({ entries })
