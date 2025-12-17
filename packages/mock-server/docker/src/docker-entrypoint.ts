import { readFileSync } from 'node:fs'

import { loadDocument } from './document-loader'
import { startMockServer } from './server'

function parseCommandLineArgs(): { url?: string } {
  const args = process.argv.slice(2)
  const result: { url?: string } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    // --url <URL>
    if (arg === '--url' && i + 1 < args.length) {
      const value = args[i + 1]?.trim()
      if (value) {
        result.url = value
      }
      i++ // Skip next argument
    }
  }

  return result
}

async function main(): Promise<void> {
  const { url } = parseCommandLineArgs()

  const { path, format } = await loadDocument(url)
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
