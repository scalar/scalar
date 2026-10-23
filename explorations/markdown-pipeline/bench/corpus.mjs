/**
 * Downloads real API descriptions and the GFM spec, then collects every
 * `description` string into one corpus. These are what `ScalarMarkdown`
 * renders, so they are the honest input for both speed and parity.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { CORPUS, GFM_SPEC, OUT } from './paths.mjs'

const SOURCES = {
  stripe: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
  github:
    'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json',
  galaxy: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
}

const download = async (url, file) => {
  if (existsSync(file)) return
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
}

await download('https://raw.githubusercontent.com/github/cmark-gfm/master/test/spec.txt', GFM_SPEC)

const out = {}
for (const [name, url] of Object.entries(SOURCES)) {
  const file = `${OUT}${name}.json`
  await download(url, file)
  const all = []
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk)
    if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) {
        if (k === 'description' && typeof x === 'string') all.push(x)
        else walk(x)
      }
  }
  walk(JSON.parse(readFileSync(file, 'utf8')))
  out[name] = all
  const bytes = all.reduce((a, s) => a + s.length, 0)
  console.log(name, 'descriptions', all.length, 'unique', new Set(all).size, 'MB', (bytes / 1e6).toFixed(2))
}
writeFileSync(CORPUS, JSON.stringify(out))
