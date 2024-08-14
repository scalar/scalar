import { createRollupConfig, findEntryPoints } from '@scalar/build-tooling'

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
    input: await findEntryPoints(),
  },
})
