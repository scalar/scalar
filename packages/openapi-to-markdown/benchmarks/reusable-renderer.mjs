import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'

import { createMarkdownFromOpenApi, createOpenApiMarkdownRenderer } from '../dist/index.js'

const operationCount = Number(process.argv[2] ?? 1000)
assert(Number.isSafeInteger(operationCount) && operationCount > 0, 'Pass a positive operation count')
const document = {
  openapi: '3.1.0',
  info: { title: 'Renderer benchmark', version: '1' },
  servers: [{ url: 'https://api.example.com' }],
  components: { schemas: { Item: { type: 'object', properties: { id: { type: 'string' } } } } },
  paths: Object.fromEntries(
    Array.from({ length: operationCount }, (_, index) => [
      `/items/${index}`,
      {
        get: {
          summary: `Item ${index}`,
          responses: {
            '200': {
              description: 'Success',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
            },
          },
        },
      },
    ]),
  ),
}
const selection = (index) => ({ operation: { path: `/items/${index}`, method: 'get' } })
const preparationStart = performance.now()
const renderer = await createOpenApiMarkdownRenderer(document)
const preparationMs = performance.now() - preparationStart
const measure = async (render) => {
  const start = performance.now()
  const output = await render()
  return { output, ms: performance.now() - start }
}
const samples = []
for (let index = 0; index < Math.min(operationCount, 10); index++) {
  const options = selection(Math.floor((index * operationCount) / Math.min(operationCount, 10)))
  const fresh = () => measure(() => createMarkdownFromOpenApi(document, options))
  const reused = () => measure(() => renderer.render(options))
  // Alternate order to reduce warm-up bias.
  const [first, second] = index % 2 ? [await fresh(), await reused()] : [await reused(), await fresh()]
  assert.equal(first.output, second.output)
  samples.push(index % 2 ? { freshMs: first.ms, reusedMs: second.ms } : { freshMs: second.ms, reusedMs: first.ms })
}
const allPagesStart = performance.now()
for (let index = 0; index < operationCount; index++) {
  await renderer.render(selection(index))
}
const allPagesMs = performance.now() - allPagesStart
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
console.log(
  JSON.stringify(
    {
      node: process.version,
      operationCount,
      preparationMs,
      freshMedianMs: median(samples.map((sample) => sample.freshMs)),
      reusedMedianMs: median(samples.map((sample) => sample.reusedMs)),
      allPagesMs,
      reusableTotalMs: preparationMs + allPagesMs,
      samples,
    },
    null,
    2,
  ),
)
