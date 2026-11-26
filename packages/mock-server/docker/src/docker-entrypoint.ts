import { readFileSync } from 'node:fs'

import { loadDocument } from './document-loader'
import { parseOptions } from './parse-options'
import { startMockServer } from './server'

async function main(): Promise<void> {
  const { url, validateRequest } = parseOptions(process.argv.slice(2), process.env)

  const { path, origin, format } = await loadDocument(url)
  const document = readFileSync(path, 'utf8')

  await startMockServer({
    document,
    origin,
    format,
    validateRequest,
  })
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
