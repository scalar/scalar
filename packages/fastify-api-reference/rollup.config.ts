import {
  addPackageFileExports,
  createRollupConfig,
} from '@scalar/build-tooling'

const entries = ['src/index.ts']

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
  copy: [
    { src: '../api-reference/dist/browser/standalone.js', dest: './dist/js' },
  ],
})

await addPackageFileExports({ entries })
