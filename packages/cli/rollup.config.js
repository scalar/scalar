import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
import del from 'rollup-plugin-delete'

const config = [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: false,
    },
    plugins: [
      json(),
      typescript({
        include: ['src/**/*', 'package.json', 'tests/**/*'],
      }),
      del({
        targets: ['dist/src', 'dist/tests'],
      }),
    ],
  },
]

export default config
