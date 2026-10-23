import { readFileSync } from 'node:fs'

import { BASELINE, CODE_HIGHLIGHT, CORPUS } from './paths.mjs'

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const src = readFileSync(CODE_HIGHLIGHT + '/src/markdown/markdown.ts', 'utf8')
const PLAIN = eval(src.match(/const PLAIN_PARAGRAPH =\s*\n\s*\/\/[^\n]*\n\s*(\/.*\/i)\n/)[1])
export const sets = {
  'stripe (all, as rendered)': corpus.stripe,
  'github (all, as rendered)': corpus.github,
  'stripe slow-path unique': [...new Set(corpus.stripe)].filter((s) => !PLAIN.test(s)),
  'github slow-path unique': [...new Set(corpus.github)].filter((s) => !PLAIN.test(s)),
}
export const time = (fn, list, minMs = 400) => {
  for (let i = 0; i < Math.min(list.length, 300); i++) fn(list[i]) // warm
  const runs = []
  for (let b = 0; b < 5; b++) {
    const t0 = performance.now()
    let n = 0
    do {
      for (const s of list) fn(s)
      n++
    } while (performance.now() - t0 < minMs / 5)
    runs.push((performance.now() - t0) / n)
  }
  runs.sort((a, b) => a - b)
  return runs[2]
}
export const run = (impls) => {
  const bytes = Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.reduce((a, s) => a + s.length, 0)]))
  console.log('set'.padEnd(28), ...Object.keys(impls).map((k) => k.padStart(16)))
  for (const [k, list] of Object.entries(sets)) {
    const cells = []
    for (const fn of Object.values(impls)) {
      const ms = time(fn, list)
      cells.push(`${ms.toFixed(0)}ms ${(bytes[k] / ms / 1000).toFixed(1)}MB/s`.padStart(16))
    }
    console.log(`${k} (${list.length})`.padEnd(28), ...cells)
  }
}
if (process.argv[1].endsWith('bench.mjs')) {
  const { htmlFromMarkdown } = await import(BASELINE)
  const { marked } = await import('marked')
  const MarkdownIt = (await import('markdown-it')).default
  const { micromark } = await import('micromark')
  const { gfm, gfmHtml } = await import('micromark-extension-gfm')
  const md = new MarkdownIt({ html: true, linkify: true }).enable(['table', 'strikethrough'])
  const opts = { removeTags: ['img', 'picture'] }
  run({
    current: (s) => htmlFromMarkdown(s, opts),
    marked: (s) => marked.parse(s, { async: false }),
    'markdown-it': (s) => md.render(s),
    micromark: (s) => micromark(s, { allowDangerousHtml: true, extensions: [gfm()], htmlExtensions: [gfmHtml()] }),
  })
}
