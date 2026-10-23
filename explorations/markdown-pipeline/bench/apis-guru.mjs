/**
 * Collects every `description` from every API in the APIs.guru directory
 * (the preferred version of each), deduplicated, with one source per string.
 * Documents are processed as they arrive and not kept.
 */
import { existsSync, writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const list = await (await fetch('https://api.apis.guru/v2/list.json')).json()
const jobs = Object.entries(list).map(([name, api]) => {
  const v = api.versions[api.preferred] ?? Object.values(api.versions).at(-1)
  return { name, url: v.swaggerUrl }
})
console.log('APIs', jobs.length)

const seen = new Map()
let done = 0
let failed = 0
let total = 0
const walk = (v, source) => {
  if (Array.isArray(v)) return v.forEach((x) => walk(x, source))
  if (!v || typeof v !== 'object') return
  for (const [k, x] of Object.entries(v)) {
    if (k === 'description' && typeof x === 'string') {
      total++
      if (!seen.has(x)) seen.set(x, source)
    } else walk(x, source)
  }
}
const worker = async () => {
  for (let job; (job = jobs.shift()); ) {
    try {
      const res = await fetch(job.url, { signal: AbortSignal.timeout(60000) })
      if (!res.ok) throw new Error(String(res.status))
      walk(await res.json(), job.name)
    } catch {
      failed++
    }
    if (++done % 250 === 0) console.log(`${done} done, ${failed} failed, ${seen.size} unique descriptions`)
  }
}
await Promise.all(Array.from({ length: 24 }, worker))
console.log(`finished: ${done} APIs, ${failed} failed, ${total} descriptions, ${seen.size} unique`)
writeFileSync(`${OUT}apis-guru.json`, JSON.stringify([...seen]))
