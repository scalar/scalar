import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'

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
    ],
  },
]

export default config
