/**
 * Shrinks unexplained differences to minimal inputs (delta debugging on blocks, then lines, then
 * words), keeping only steps where the difference stays unexplained, and groups the results.
 *
 *   node bench/minimize.mjs <label> [sample]
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { bucketOf } from './classify.mjs'
import { normalize } from './normalize.mjs'
import { BASELINE, OUT, PROTOTYPE } from './paths.mjs'

const [label, sample = '400'] = process.argv.slice(2)
const current = await import(BASELINE)
const prototype = await import(PROTOTYPE)
const OPTIONS = { default: { removeTags: ['img', 'picture'] }, withImages: { removeTags: [] } }

const diffOf = (markdown) => {
  const diffs = []
  for (const [options, o] of Object.entries(OPTIONS)) {
    let a
    try {
      a = normalize(current.htmlFromMarkdown(markdown, o))
    } catch (e) {
      a = `THREW ${e?.constructor?.name}`
    }
    const b = normalize(prototype.htmlFromMarkdown(markdown, o))
    if (a !== b) diffs.push({ options, current: a, prototype: b })
  }
  return diffs.length ? { markdown, source: '', diffs } : null
}
const unexplained = (markdown) => {
  if (markdown.length > 4000) return false
  const d = diffOf(markdown)
  return !!d && bucketOf(d) === 'other'
}

/** Removes parts while `keep` holds, coarse to fine. */
const shrink = (markdown) => {
  for (const split of [/\n{2,}/, /\n/, / /]) {
    const join = split.source === ' ' ? ' ' : split.source === '\\n' ? '\n' : '\n\n'
    let parts = markdown.split(split)
    for (let i = parts.length - 1; i >= 0; i--) {
      const candidate = [...parts.slice(0, i), ...parts.slice(i + 1)].join(join)
      if (candidate.trim() && unexplained(candidate)) parts = [...parts.slice(0, i), ...parts.slice(i + 1)]
    }
    markdown = parts.join(join)
  }
  return markdown
}

const { different } = JSON.parse(readFileSync(`${OUT}${label}-other-diffs.json`, 'utf8'))
const picked = different
  .filter((_, i) => i % Math.max(1, Math.floor(different.length / Number(sample))) === 0)
  .slice(0, Number(sample))
const minimized = new Map()
const t0 = Date.now()
for (const [n, d] of picked.entries()) {
  const m = unexplained(d.markdown) ? shrink(d.markdown) : null
  if (m) minimized.set(m, (minimized.get(m) ?? 0) + 1)
  if ((n + 1) % 50 === 0)
    console.log(`  ${n + 1}/${picked.length} (${((Date.now() - t0) / 1000).toFixed(0)}s), ${minimized.size} distinct`)
}
const list = [...minimized].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
writeFileSync(`${OUT}${label}-minimized.json`, JSON.stringify(list, null, 1))
console.log(`${picked.length} sampled, ${list.length} distinct minimal inputs`)
for (const [md, count] of list.slice(0, Number(process.env.TOP ?? 40))) {
  const d = diffOf(md)
  console.log(
    `\n[${count}] ${JSON.stringify(md)}\n   cur ${JSON.stringify(d.diffs[0].current).slice(0, 200)}\n   pro ${JSON.stringify(d.diffs[0].prototype).slice(0, 200)}`,
  )
}
