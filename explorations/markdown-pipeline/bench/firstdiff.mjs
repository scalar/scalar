/** The first point where the two outputs diverge, for differences whose source matches: `node bench/firstdiff.mjs <label> <text>...` */
import { readFileSync } from 'node:fs'

import { normalize } from './normalize.mjs'
import { OUT } from './paths.mjs'

const [label, ...needles] = process.argv.slice(2)
const { different } = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
for (const k of needles) {
  const d = different.find((x) => x.source.includes(k))
  if (!d) {
    console.log('=====', k, 'not in the list')
    continue
  }
  for (const { options, current: a, prototype: b } of d.diffs) {
    let i = 0
    while (i < a.length && a[i] === b[i]) i++
    console.log(
      `===== ${d.source} (${options})\n cur …${JSON.stringify(a.slice(Math.max(0, i - 160), i + 160))}\n pro …${JSON.stringify(b.slice(Math.max(0, i - 160), i + 160))}`,
    )
  }
}
void normalize
