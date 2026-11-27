import { BASELINE, PROTOTYPE } from './paths.mjs'

// Inputs from cmark's test/pathological_tests.py, scaled to n.
const { htmlFromMarkdown: base } = await import(BASELINE)
const { htmlFromMarkdown: proto } = await import(PROTOTYPE)
const n = Number(process.argv[2] ?? 30000)
const r = (s, k = n) => s.repeat(k)
const cases = {
  'nested strong emph': r('*a **a ', n / 10) + 'b' + r(' a** a*', n / 10),
  'many emph closers, no openers': r('a_ '),
  'many emph openers, no closers': r('_a '),
  'many link closers, no openers': r('a]'),
  'many link openers, no closers': r('[a'),
  'mismatched openers and closers': r('*a_ '),
  'openers and closers multiple of 3': 'a**b' + r('c* '),
  'link openers and emph closers': r('[ a_'),
  'pattern [ (]( repeated': r('[ (]('),
  'nested brackets': r('[', n / 2) + 'a' + r(']', n / 2),
  'nested block quotes': r('> ', n / 3) + 'a',
  'deeply nested lists': Array.from({ length: 1000 }, (_, i) => '  '.repeat(i) + '* a\n').join(''),
  'U+0000 in input': r('abc\u0000de\u0000'),
  'backticks': Array.from({ length: 1000 }, (_, i) => 'e' + '`'.repeat(i + 1)).join(''),
  'unclosed links A': r('[a](<b'),
  'unclosed links B': r('[a](b'),
  'unclosed <!--': '</' + r('<!--'),
  'many raw HTML tags': r('<a href="x">'),
  'many references': Array.from({ length: n / 3 }, (_, i) => `[${i}]: u\n`).join('') + r('[x] ', n / 10),
  'table, many columns': '|' + r('a|', 2000) + '\n|' + r('-|', 2000) + '\n' + r('|' + r('b|', 2000) + '\n', 20),
  'autolink literal soup': r('www.a.b_c. '),
}
const t = (f, s) => {
  const t0 = performance.now()
  try {
    f(s)
  } catch (e) {
    return 'threw ' + e.constructor.name
  }
  return (performance.now() - t0).toFixed(0) + 'ms'
}
console.log('case'.padEnd(34), 'size'.padStart(8), 'current'.padStart(14), 'prototype'.padStart(12))
const only = process.argv[3]
for (const [k, s] of Object.entries(cases))
  console.log(
    k.padEnd(34),
    String(s.length).padStart(8),
    (only === 'proto' ? '-' : t(base, s)).padStart(14),
    t(proto, s).padStart(12),
  )
