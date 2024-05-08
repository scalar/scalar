import typescript from '@rollup/plugin-typescript'
import del from 'rollup-plugin-delete'

const config = [
  {
    input: './src/index.ts',
    output: {
      out: 'dist',
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      typescript({
        outputToFilesystem: true,
      }),
      del({
        targets: ['dist/tests', 'dist/**/*.test.*'],
      }),
    ],
  },
]

export default config
