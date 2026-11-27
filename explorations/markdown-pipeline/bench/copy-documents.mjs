/**
 * Whole documents through Copy as Markdown, old against new: a deterministic sample of the
 * APIs.guru directory (OpenAPI 2.0 and 3.x, `swaggerUrl` of each API's preferred version) and the
 * AsyncAPI specification's examples. Documents are downloaded once into `.out/documents/` and only
 * ever parsed as data.
 *
 *   node bench/copy-documents.mjs [count]
 *
 * A document whose new output equals the `explained` side (the old converters with the intended
 * changes) differs only by those changes. Anything else is listed with its first differing lines.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const [count = '300'] = process.argv.slice(2)
const DIR = `${OUT}documents/`
mkdirSync(DIR, { recursive: true })

const ASYNCAPI = [
  'adeo-kafka-request-reply-asyncapi.yml',
  'anyof-asyncapi.yml',
  'application-headers-asyncapi.yml',
  'correlation-id-asyncapi.yml',
  'gitter-streaming-asyncapi.yml',
  'kraken-websocket-request-reply-message-filter-in-reply-asyncapi.yml',
  'kraken-websocket-request-reply-multiple-channels-asyncapi.yml',
  'mercure-asyncapi.yml',
  'not-asyncapi.yml',
  'oneof-asyncapi.yml',
  'operation-security-asyncapi.yml',
  'rpc-client-asyncapi.yml',
  'rpc-server-asyncapi.yml',
  'simple-asyncapi.yml',
  'slack-rtm-asyncapi.yml',
  'streetlights-kafka-asyncapi.yml',
  'streetlights-mqtt-asyncapi.yml',
  'streetlights-operation-security-asyncapi.yml',
  'websocket-gemini-asyncapi.yml',
]

const download = async (url, file) => {
  if (existsSync(file)) return true
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!res.ok) return false
    writeFileSync(file, await res.text())
    return true
  } catch {
    return false
  }
}

if (!readdirSync(DIR).some((f) => f.startsWith('openapi-'))) {
  const list = await (await fetch('https://api.apis.guru/v2/list.json')).json()
  const names = Object.keys(list).sort()
  // Every n-th API, so the sample spreads over the directory instead of one provider's APIs.
  const step = Math.max(1, Math.floor(names.length / Number(count)))
  const jobs = names
    .filter((_, i) => i % step === 0)
    .slice(0, Number(count))
    .map((name, i) => {
      const api = list[name]
      const version = api.versions[api.preferred] ?? Object.values(api.versions).at(-1)
      return { url: version.swaggerUrl, file: `${DIR}openapi-${String(i).padStart(4, '0')}.json` }
    })
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      for (let job; (job = jobs.shift()); ) await download(job.url, job.file)
    }),
  )
}
for (const name of ASYNCAPI) {
  await download(`https://raw.githubusercontent.com/asyncapi/spec/master/examples/${name}`, `${DIR}asyncapi-${name}`)
}

const sides = {
  old: await import(`${OUT}copy-old.mjs`),
  new: await import(`${OUT}copy-new.mjs`),
  explained: await import(`${OUT}copy-explained.mjs`),
}
/** Generated examples hold the current time, which differs between two renders. */
const TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g
const render = async (side, file) => {
  const text = readFileSync(`${DIR}${file}`, 'utf8')
  const markdown = file.startsWith('asyncapi-')
    ? await side.createMarkdownFromAsyncApi(text)
    : await side.createMarkdownFromOpenApi(JSON.parse(text))
  return markdown.replace(TIMESTAMP, '<timestamp>')
}

const firstDifference = (a, b) => {
  const x = a.split('\n')
  const y = b.split('\n')
  let i = 0
  while (i < x.length && x[i] === y[i]) i++
  return { line: i + 1, before: x.slice(i, i + 3).join('\n'), after: y.slice(i, i + 3).join('\n') }
}

const stats = {}
const unexplained = []
const started = Date.now()
for (const file of readdirSync(DIR).sort()) {
  const kind = file.startsWith('asyncapi-') ? 'asyncapi' : 'openapi'
  const s = (stats[kind] ??= {
    documents: 0,
    identical: 0,
    explained: 0,
    unexplained: 0,
    failedBoth: 0,
    failedNew: 0,
    bytes: 0,
  })
  let before
  try {
    before = await render(sides.old, file)
  } catch {
    // A document the old side cannot render either says nothing about the change.
    s.failedBoth++
    continue
  }
  s.documents++
  let after
  try {
    after = await render(sides.new, file)
  } catch (error) {
    s.failedNew++
    unexplained.push({ file, error: String(error) })
    continue
  }
  s.bytes += after.length
  if (after === before) {
    s.identical++
    continue
  }
  const expected = await render(sides.explained, file)
  if (after === expected) {
    s.explained++
    continue
  }
  s.unexplained++
  unexplained.push({ file, ...firstDifference(expected, after) })
}
console.log(JSON.stringify({ stats, seconds: Math.round((Date.now() - started) / 1000) }, null, 2))
for (const u of unexplained.slice(0, 10)) console.log(JSON.stringify(u, null, 2))
writeFileSync(`${OUT}copy-documents.json`, JSON.stringify({ stats, unexplained }, null, 1))
