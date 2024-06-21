import del from 'rollup-plugin-delete'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const bundle = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
})

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      // ESM
      {
        file: `dist/index.js`,
        format: 'es',
        sourcemap: true,
      },
      // CommonJS
      {
        file: `dist/index.cjs`,
        format: 'cjs',
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [
      dts(),
      del({
        targets: ['dist/tests', 'dist/**/*.test.*'],
      }),
    ],
    output: {
      file: `dist/index.d.ts`,
      format: 'es',
    },
  }),
]
