import { readFileSync, writeFileSync } from 'node:fs'

import { normalize } from './normalize.mjs'
import { BASELINE, CORPUS, OUT, PROTOTYPE } from './paths.mjs'

const { htmlFromMarkdown: base } = await import(BASELINE)
const { htmlFromMarkdown: proto } = await import(PROTOTYPE)
const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const opts = { removeTags: ['img', 'picture'] }
const diffs = []
let total = 0
for (const [name, list] of Object.entries(corpus)) {
  const u = [...new Set(list)]
  let same = 0
  for (const s of u) {
    const a = normalize(base(s, opts)),
      b = normalize(proto(s, opts))
    if (a === b) same++
    else diffs.push({ name, s, base: a, proto: b })
  }
  total += u.length
  console.log(`${name.padEnd(7)} ${same}/${u.length} identical DOM (${((100 * same) / u.length).toFixed(2)}%)`)
}
writeFileSync(OUT + 'diffs.json', JSON.stringify(diffs, null, 1))
console.log('total diffs', diffs.length, 'of', total)
