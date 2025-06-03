import { build } from '@scalar/build-tooling/esbuild'

const entries = ['src/index.ts']

// Build the playground for docker deployments
if (process.env.BUILD_PLAYGROUND) {
  entries.push('playground/index.ts')
}

build({
  entries,
  platform: 'node',
})
