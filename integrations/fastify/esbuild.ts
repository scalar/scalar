import { build } from '@scalar/build-tooling/esbuild'

const entries = ['src/index.ts']

build({
  entries,
  platform: 'node',
  // required to bundle those files:
  // - theme.css
  // - scalar.js
  bundle: true,
  options: {
    /** Inline CSS files as text strings */
    loader: {
      '.css': 'text',
      '.js': 'text',
    },
  },
})
