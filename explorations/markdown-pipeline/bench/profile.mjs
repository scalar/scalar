import { readFileSync } from 'node:fs'

import { CODE_HIGHLIGHT, CORPUS } from './paths.mjs'

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const src = readFileSync(CODE_HIGHLIGHT + '/src/markdown/markdown.ts', 'utf8')
const PLAIN = eval(src.match(/const PLAIN_PARAGRAPH =\s*\n\s*\/\/[^\n]*\n\s*(\/.*\/i)\n/)[1])
for (const [name, list] of Object.entries(corpus)) {
  const u = [...new Set(list)]
  const pct = (f) => ((100 * u.filter(f).length) / u.length).toFixed(1) + '%'
  console.log(
    name.padEnd(7),
    'unique',
    u.length,
    '| plain fast-path',
    pct((s) => PLAIN.test(s)),
    '| raw HTML tag',
    pct((s) => /<\/?[a-zA-Z][^>]*>/.test(s)),
    '| fence',
    pct((s) => /^\s*(```|~~~)/m.test(s)),
    '| table',
    pct((s) => /^\s*\|.*\|\s*$/m.test(s)),
    '| list',
    pct((s) => /^\s*([-*+]|\d+\.)\s/m.test(s)),
    '| heading',
    pct((s) => /^#{1,6}\s/m.test(s)),
    '| alert',
    pct((s) => /\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i.test(s)),
    '| p50 len',
    u.map((s) => s.length).sort((a, b) => a - b)[u.length >> 1],
    '| max',
    Math.max(...u.map((s) => s.length)),
  )
}
