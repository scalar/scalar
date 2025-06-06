import { build } from '@scalar/build-tooling/esbuild'
import fs from 'node:fs/promises'

async function convertSchema(version: string) {
  const js = await fs.readFile(`src/schemas/v${version}/schema.json`, 'utf-8')
  await fs.writeFile(`src/schemas/v${version}/schema.ts`, `export default ${js}`)
}

// Convert the JSON schemas to TypeScript to keep them up to date
await convertSchema('2.0')
await convertSchema('3.0')
await convertSchema('3.1')

const entries = [
  './src/index.ts',
  './src/plugins.ts',
  './src/plugins-browser.ts',

  './src/plugins/fetch-urls/index.ts',
  './src/plugins/read-files/index.ts',
]

build({
  entries,
  platform: 'shared',
  allowJs: true,
})
