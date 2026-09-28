import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform, arch } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Run each source/mode in a fresh process with --expose-gc --max-old-space-size=768.
const [modulePath, sourcePath, mode, outputPrefix] = process.argv.slice(2)
const api = await import(pathToFileURL(resolve(modulePath)).href)
const source = readFileSync(sourcePath, 'utf8')
const raw = JSON.parse(source)
const selectedPath = raw.paths['/v1/account'] ? '/v1/account' : '/zones'
const options = mode === 'linked' ? { schemaReferences: { mode: 'linked', resolveUrl: ({ name }) => `/models/${encodeURIComponent(name)}` } } : {}
global.gc?.()
const startMemory = process.memoryUsage()
const start = performance.now()
const renderer = await api.createOpenApiMarkdownRenderer(source)
const loadingMs = performance.now() - start
global.gc?.()
const loadedMemory = process.memoryUsage()
const singleStart = performance.now()
const markdown = await renderer.render({ operation: { path: selectedPath, method: 'get' }, ...options })
const singleOperationMs = performance.now() - singleStart
writeFileSync(`${outputPrefix}-operation.md`, markdown)
let modelBytes
if (raw.components?.schemas?.account) {
  const model = await renderer.render({ model: 'account', ...options })
  writeFileSync(`${outputPrefix}-account-model.md`, model)
  modelBytes = Buffer.byteLength(model)
}
const operations = Object.entries(raw.paths ?? {}).flatMap(([path, item]) => Object.keys(item).filter((method) => ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'query'].includes(method)).map((method) => ({ operation: { path, method } })))
const models = Object.keys(raw.components?.schemas ?? {}).map((model) => ({ model }))
const renderingStart = performance.now()
let operationBytes = 0
let totalModelBytes = 0
for (const [selectors, kind] of [[operations, 'operation'], [models, 'model']]) {
  for (const selector of selectors) {
    const bytes = Buffer.byteLength(await renderer.render({ ...selector, ...options }))
    if (kind === 'operation') operationBytes += bytes
    else totalModelBytes += bytes
  }
}
const renderingMs = performance.now() - renderingStart
const result = {
  source: sourcePath, sha256: createHash('sha256').update(source).digest('hex'), sourceBytes: Buffer.byteLength(source),
  node: process.version, platform: platform(), architecture: arch(), cpu: cpus()[0]?.model,
  heapLimitMiB: 768, mode, modulePath, loadingMs, singleOperationMs, renderingMs,
  startMemory, loadedMemory, endMemory: process.memoryUsage(), peakRssMiB: process.resourceUsage().maxRSS / 1024,
  singleOperationBytes: Buffer.byteLength(markdown), accountModelBytes: modelBytes,
  operations: operations.length, models: models.length, operationBytes, modelBytes: totalModelBytes, totalBytes: operationBytes + totalModelBytes,
}
writeFileSync(`${outputPrefix}.json`, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result))
