import assert from 'node:assert/strict'

import { createAsyncApiMarkdownRenderer } from '../src/index'
import { sharedDocument } from './fixtures'

const input = sharedDocument()
const start = performance.now()
const renderer = await createAsyncApiMarkdownRenderer(input)
const preparation = performance.now() - start
for (const [name, options] of [
  ['document', {}],
  ['operation', { operation: 'receive0' }],
  ['linked', { operation: 'receive0', schemaReferences: { mode: 'linked' } }],
] as const) {
  const samples: number[] = []
  let baseline: string | undefined
  for (let iteration = 0; iteration < 5; iteration++) {
    const started = performance.now()
    const markdown = await renderer.render(options)
    samples.push(performance.now() - started)
    assert(!markdown.includes('Schema expansion limit reached'))
    if (baseline !== undefined) {
      assert.equal(markdown, baseline)
    }
    baseline = markdown
  }
  console.log(
    JSON.stringify({
      workload: name,
      preparationMs: preparation,
      samplesMs: samples,
      bytes: Buffer.byteLength(baseline!),
      rss: process.memoryUsage().rss,
    }),
  )
}
