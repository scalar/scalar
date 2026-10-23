import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { normalize } from './normalize.mjs'
import { GFM_SPEC, PROTOTYPE } from './paths.mjs'

const COMMONMARK_SPEC = createRequire(import.meta.url).resolve('commonmark-spec/spec.txt')
const { htmlFromMarkdown } = await import(PROTOTYPE)
const parseSpec = (file) => {
  const out = []
  const lines = readFileSync(file, 'utf8').split('\n')
  let section = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#')) section = lines[i].replace(/^#+ /, '')
    const m = /^`{32} example(.*)$/.exec(lines[i])
    if (!m) continue
    let md = '',
      html = '',
      j = i + 1
    while (lines[j] !== '.') md += lines[j++] + '\n'
    j++
    while (!lines[j].startsWith('`'.repeat(32))) html += lines[j++] + '\n'
    out.push({ md: md.replace(/→/g, '\t'), html: html.replace(/→/g, '\t'), section, ext: m[1].trim(), line: i + 1 })
    i = j
  }
  return out
}
const run = (name, examples) => {
  const bySection = {}
  let pass = 0
  const fails = []
  for (const ex of examples) {
    let got
    try {
      got = htmlFromMarkdown(ex.md, { unsafe: true })
    } catch (e) {
      got = 'THREW ' + e.message
    }
    const opts = ex.ext ? { dropAttrs: ['class'] } : {}
    const ok = normalize(got.trimEnd(), opts) === normalize(ex.html.trimEnd(), opts)
    bySection[ex.section] ??= [0, 0]
    bySection[ex.section][1]++
    if (ok) {
      pass++
      bySection[ex.section][0]++
    } else fails.push({ ...ex, got })
  }
  console.log(`\n${name}: ${pass}/${examples.length} (${((100 * pass) / examples.length).toFixed(1)}%)`)
  for (const [s, [p, t]] of Object.entries(bySection)) if (p < t) console.log(`  ${s.padEnd(36)} ${p}/${t}`)
  return fails
}
const cm = run('CommonMark 0.31.2', parseSpec(COMMONMARK_SPEC))
const gfm = run(
  'GFM extensions',
  parseSpec(GFM_SPEC).filter((e) => e.ext),
)
if (process.argv[2])
  for (const f of [...cm, ...gfm]
    .filter((f) => f.section.includes(process.argv[2]) || String(f.line) === process.argv[2])
    .slice(0, +(process.argv[3] ?? 6)))
    console.log(
      '\n--- line',
      f.line,
      f.section,
      '\n' + JSON.stringify(f.md),
      '\nexp',
      JSON.stringify(normalize(f.html)),
      '\ngot',
      JSON.stringify(normalize(f.got)),
    )
