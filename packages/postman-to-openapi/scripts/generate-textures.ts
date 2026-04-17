import fs from 'node:fs/promises'
import path from 'node:path'

import { convert } from '../src/convert'
const FIXTURES = [
  'SimplePost',
  'NoVersion',
  'Folders',
  'GetMethods',
  'PathParams',
  'MultipleServers',
  'LicenseContact',
  'ParseStatusCode',
  'NoPath',
  'DeleteOperation',
  'AuthBearer',
  'AuthBasic',
  'UrlWithPort',
  'ExternalDocs',
  'EmptyUrl',
  'XLogo',
  'AuthMultiple',
  'AuthRequest',
  'FormData',
  'FormUrlencoded',
  'RawBody',
  'OperationIds',
  'NestedServers',
  'Headers',
  'ResponsesEmpty',
  'Responses',
]

const generateTextures = async () => {
  console.log('🎨 Generating textures...')
  const fixturesPath = path.join(import.meta.dirname, '../fixtures')
  const inputPath = path.join(fixturesPath, 'input')
  const outputPath = path.join(fixturesPath, 'output')

  await fs.mkdir(outputPath, { recursive: true })

  for (const fixture of FIXTURES) {
    const input = await fs.readFile(path.join(inputPath, `${fixture}.json`), 'utf8')
    const postman = JSON.parse(input)
    const output = convert(postman)
    await fs.writeFile(path.join(outputPath, `${fixture}.json`), JSON.stringify(output, null, 2))
    console.log(`✅ Generated texture for ${fixture}`)
  }
  console.log('🎉 Textures generated successfully')
}

await generateTextures()
