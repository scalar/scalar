import { readFileSync } from 'node:fs'

import { loadDocument } from './document-loader'
import { startMockServer } from './server'

async function main(): Promise<void> {
  const { path, format } = loadDocument()
  const document = readFileSync(path, 'utf8')

  await startMockServer({
    document,
    format,
  })
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
