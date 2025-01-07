import {
  addPackageFileExports,
  createRollupConfig,
} from '@scalar/build-tooling'

const entries = ['src/index.ts']

// Build the playground for docker deployments
if (process.env.BUILD_PLAYGROUND) {
  entries.push('playground/index.ts')
}

export default createRollupConfig({
  typescript: true,
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries })
