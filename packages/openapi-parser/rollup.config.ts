import terser from '@rollup/plugin-terser'
import {
  addPackageFileExports,
  createRollupConfig,
} from '@scalar/build-tooling'
import { builtinModules } from 'node:module'
import outputSize from 'rollup-plugin-output-size'

const entries = [
  'src/index.ts',
  'src/utils/load/plugins/fetchUrls.ts',
  'src/utils/load/plugins/readFiles.ts',
]

// Do not use the findEntryPoints helper - it will overwrite the static file outputs
export default createRollupConfig({
  typescript: true,

  options: {
    input: entries,
    plugins: [terser(), outputSize()],
    external: [
      ...builtinModules,
      ...builtinModules.map((m) => `node:${m}`),
      'ajv/dist/2020',
      'ajv-draft-04',
      'ajv-formats',
      'yaml',
      '@scalar/openapi-types',
    ],
  },
  emptyOutDir: true,
})

await addPackageFileExports({ entries })
