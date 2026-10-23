// Scores the baseline on the same spec, raw HTML allowed and unsanitized, for a fair comparison.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { normalize } from './normalize.mjs'
import { CODE_HIGHLIGHT, GFM_SPEC, PROTOTYPE } from './paths.mjs'

const COMMONMARK_SPEC = createRequire(import.meta.url).resolve('commonmark-spec/spec.txt')
const BCH = CODE_HIGHLIGHT + '/node_modules/'
const { unified } = await import(BCH + 'unified/index.js')
const remarkParse = (await import(BCH + 'remark-parse/index.js')).default
const remarkGfm = (await import(BCH + 'remark-gfm/index.js')).default
const remarkRehype = (await import(BCH + 'remark-rehype/index.js')).default
const rehypeRaw = (await import(BCH + 'rehype-raw/index.js')).default
const rehypeStringify = (await import(BCH + 'rehype-stringify/index.js')).default
const base = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)
  .freeze()
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
for (const [name, ex] of [
  ['CommonMark', parseSpec(COMMONMARK_SPEC)],
  ['GFM ext', parseSpec(GFM_SPEC).filter((e) => e.ext)],
]) {
  let b = 0,
    p = 0,
    agree = 0
  const onlyBase = []
  for (const e of ex) {
    const o = e.ext ? { dropAttrs: ['class'] } : {}
    const exp = normalize(e.html, o)
    const bo = normalize(String(base.processSync(e.md)), o)
    const po = normalize(htmlFromMarkdown(e.md, { unsafe: true }), o)
    if (bo === exp) b++
    if (po === exp) p++
    if (bo === po) agree++
    if (bo === exp && po !== exp) onlyBase.push(e.line + ' ' + e.section)
  }
  console.log(
    `${name}: baseline ${b}/${ex.length}, prototype ${p}/${ex.length}, identical to each other ${agree}/${ex.length}; baseline-only passes: ${onlyBase.join('; ') || 'none'}`,
  )
}
