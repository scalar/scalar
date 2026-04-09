import fs from 'node:fs/promises'
import path from 'node:path'

import { convert } from '../src/convert'

const BUCKET_NAME = 'scalar-test-fixtures'
const BUCKET_URL = `https://storage.googleapis.com/${BUCKET_NAME}`
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
  for (const fixture of FIXTURES) {
    const input = await fetch(`${BUCKET_URL}/packages/postman-to-openapi/input/${fixture}.json`)
    const postman = await input.json()
    const output = convert(postman)
    const outputPath = path.join(import.meta.dirname, '../fixtures/output')
    await fs.mkdir(outputPath, { recursive: true })
    await fs.writeFile(path.join(outputPath, `${fixture}.json`), JSON.stringify(output))
    console.log(`✅ Generated texture for ${fixture}`)
  }
  console.log('🎉 Textures generated successfully')
}

await generateTextures()
