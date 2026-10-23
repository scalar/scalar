/** Groups the differences in a differential run by the shape of the first differing line. */
import { readFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const [label, show = '3'] = process.argv.slice(2)
const { different } = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
const shape = (s) =>
  (s ?? '∅')
    .replace(/>[^<]+</g, '>…<')
    .replace(/^[^<]+/, '…')
    .replace(/="[^"]*"/g, '=""')
    .slice(0, 90)
const groups = new Map()
for (const d of different) {
  const { current, prototype } = d.diffs[0]
  const a = current.split('\n')
  const b = prototype.split('\n')
  let i = 0
  while (i < a.length && a[i] === b[i]) i++
  const key = `${shape(a[i])}  ⟶  ${shape(b[i])}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push({ d, line: i, a, b })
}
const sorted = [...groups].sort((x, y) => y[1].length - x[1].length)
console.log(`${different.length} differences in ${groups.size} shapes`)
for (const [key, list] of sorted.slice(0, Number(process.env.TOP ?? 25))) {
  console.log(`\n[${list.length}] ${key}`)
  for (const { d, line, a, b } of list.slice(0, Number(show))) {
    const i = d.markdown.length > 400 ? '' : `\n      md:  ${JSON.stringify(d.markdown)}`
    console.log(
      `    ${d.source}${i}\n      cur: ${JSON.stringify(a.slice(Math.max(0, line - 1), line + 2).join('⏎')).slice(0, 300)}\n      pro: ${JSON.stringify(b.slice(Math.max(0, line - 1), line + 2).join('⏎')).slice(0, 300)}`,
    )
  }
}
