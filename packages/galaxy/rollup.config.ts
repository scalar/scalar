import { createRollupConfig } from '@scalar/build-tooling'

const input = ['src/index.ts']

// Build the playground for docker deployments
if (process.env.BUILD_PLAYGROUND) {
  input.push('playground/index.ts')
}

// Do not use the findEntryPoints helper - it will overwrite the static file outputs
export default createRollupConfig({
  typescript: true,
  copy: [
    { src: 'src/documents/3.1.yaml', dest: 'dist' },
    {
      src: 'src/documents/3.1.yaml',
      dest: 'dist',
      rename: 'latest.yaml',
    },
  ],
  options: {
    input: input,
  },
})
