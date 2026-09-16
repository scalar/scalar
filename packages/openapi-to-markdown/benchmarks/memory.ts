import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { createMarkdownFromOpenApi } from '../dist/index.js'

const path = process.argv[2]
if (!path) {
  throw new Error('Usage: node --max-old-space-size=512 benchmarks/memory.ts <openapi.json>')
}
const start = performance.now()
const raw = readFileSync(path)
const document = JSON.parse(raw.toString())
const markdown = await createMarkdownFromOpenApi(document)
const peakRssBytes = process.resourceUsage().maxRSS * 1024
console.log(
  JSON.stringify(
    {
      node: process.version,
      inputBytes: raw.length,
      sha256: createHash('sha256').update(raw).digest('hex'),
      outputBytes: Buffer.byteLength(markdown),
      seconds: (performance.now() - start) / 1000,
      peakRssBytes,
    },
    null,
    2,
  ),
)
if (peakRssBytes > 1_000_000_000) {
  throw new Error('Conversion exceeded the 1 GB peak RSS budget')
}
