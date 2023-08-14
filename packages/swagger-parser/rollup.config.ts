import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { RollupOptions } from 'rollup'
import del from 'rollup-plugin-delete'

const config: RollupOptions = {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    del({ targets: 'dist/*' }),
    typescript(),
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    json(),
  ],
}

export default config
