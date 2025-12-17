import { readFileSync } from 'node:fs'

import { loadDocument } from './document-loader'
import { startMockServer } from './server'

const PORT = 3000

async function main(): Promise<void> {
  const documentPath = await loadDocument()
  const document = readFileSync(documentPath, 'utf8')

  await startMockServer({
    document,
    port: PORT,
  })
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
