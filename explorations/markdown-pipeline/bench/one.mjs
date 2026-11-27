/** Shows the normalized line diff of one differing item: `node bench/one.mjs <label> <text in its source or Markdown>`. */
import { readFileSync } from 'node:fs'

import { normalize } from './normalize.mjs'
import { BASELINE, OUT, PROTOTYPE } from './paths.mjs'

const [label, needle] = process.argv.slice(2)
const { different } = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
const d = different.find((x) => x.source.includes(needle) || x.markdown.includes(needle))
const cur = await import(BASELINE)
const pro = await import(PROTOTYPE)
const a = normalize(cur.htmlFromMarkdown(d.markdown, { removeTags: ['img', 'picture'] })).split('\n')
const b = normalize(pro.htmlFromMarkdown(d.markdown, { removeTags: ['img', 'picture'] })).split('\n')
console.log(d.source, '\n', JSON.stringify(d.markdown.slice(0, 1500)))
let i = 0
while (a[i] === b[i] && i < a.length) i++
let ea = a.length - 1
let eb = b.length - 1
while (ea > i && eb > i && a[ea] === b[eb]) {
  ea--
  eb--
}
console.log(
  `--- current, lines ${i}-${ea}\n${a.slice(Math.max(0, i - 2), ea + 2).join('\n')}\n--- prototype\n${b.slice(Math.max(0, i - 2), eb + 2).join('\n')}`,
)
