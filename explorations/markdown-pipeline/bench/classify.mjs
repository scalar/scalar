/**
 * Sorts a differential run's differences into known current-pipeline bugs and
 * everything else, which needs a look.
 *
 *   node bench/classify.mjs <label>
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const label = process.argv[2]
const run = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
const EMPTIED =
  /<(a|span|b|strong|i|em|code|font|div|p|sup|sub|u|li|td|th|kbd|var|s|del|ins|q|small|big|abbr|dd|dt|summary|h[1-6])\b[^>]*><\/\1>/g
const count = (s, re) => (s.match(re) ?? []).length
const spaces = (s) => count(s, /\s/g)
const KNOWN = {
  /** A raw tag whose attributes contain a Markdown marker is closed at once, so its text falls out of it (links stop working). */
  'emptied element': ({ current, prototype }) => count(current, EMPTIED) > count(prototype, EMPTIED),
  /** Re-parsing raw HTML text trims the space next to an inline element ("is<code>x</code>"). */
  'lost space': ({ current, prototype }) =>
    current.replace(/\s/g, '') === prototype.replace(/\s/g, '') && spaces(current) < spaces(prototype),
  /** An alert followed by a list renders with empty content. */
  'empty alert': ({ current }) => /markdown-alert-content">\n<\/div>/.test(current),
}
const buckets = Object.fromEntries([...Object.keys(KNOWN), 'other'].map((k) => [k, []]))
for (const d of run.different) {
  const k = Object.keys(KNOWN).find((name) => d.diffs.every((x) => KNOWN[name](x))) ?? 'other'
  buckets[k].push(d)
}
console.log(
  `${label}: ${run.total} inputs, ${run.identical} identical, ${run.different.length} different, ${run.threw.length} threw, ${run.timeouts.length} timed out`,
)
for (const [k, list] of Object.entries(buckets)) console.log(`  ${k.padEnd(16)} ${list.length}`)
writeFileSync(`${OUT}${label}-other-diffs.json`, JSON.stringify({ different: buckets.other }))
