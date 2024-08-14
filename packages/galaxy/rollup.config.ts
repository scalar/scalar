import {
  addPackageFileExports,
  createRollupConfig,
} from '@scalar/build-tooling'

const entries = ['src/index.ts']

export default createRollupConfig({
  typescript: true,
  copy: [
    { src: 'src/specifications/3.1.yaml', dest: 'dist' },
    {
      src: 'src/specifications/3.1.yaml',
      dest: 'dist',
      rename: 'latest.yaml',
    },
  ],
  options: {
    input: entries,
  },
})

await addPackageFileExports({ entries })
