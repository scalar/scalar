/**
 * Generates random Markdown documents from a grammar of every construct the pipelines handle,
 * for the differential runner: `node bench/fuzz-corpus.mjs [count] [seed]`.
 */
import { writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const [count = 20000, seed0 = 1] = process.argv.slice(2).map(Number)
// mulberry32: an LCG's low bits repeat quickly, which made many documents identical.
let seed = seed0 >>> 0
const rnd = (n) => {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n)
}
const pick = (list) => list[rnd(list.length)]
const many = (f, min, max, sep = '') => Array.from({ length: min + rnd(max - min + 1) }, f).join(sep)

const WORDS = [
  'alpha',
  'beta',
  'the',
  'API',
  'user_id',
  'snake_case',
  'x*y',
  'foo-bar',
  'v1.2.3',
  'café',
  '50%',
  'a/b',
  'C++',
  '2024-01-01',
]
const INLINE_HTML = [
  '<b>',
  '</b>',
  '<i>x</i>',
  '<code>c</code>',
  '<a href="https://example.com/a_b">link</a>',
  '<a href=/rel>r</a>',
  '<br>',
  '<br/>',
  '<span class="k">s</span>',
  '<kbd>K</kbd>',
  '<sub>2</sub>',
  '<sup>3</sup>',
  '<img src="i.png" alt="i">',
  '<u>u</u>',
  '<font color=red>f</font>',
  '<script>bad()</script>',
  '<abbr title="t">a</abbr>',
  '<em>',
  '</em>',
  '<strong>s</strong>',
  '<del>d</del>',
  '<q>q</q>',
  '<!-- c -->',
  '<a name="n"></a>',
  '<input type=checkbox checked>',
  '<code/>',
  '<object>o</object>',
  '<x-foo>y</x-foo>',
]
const ENTITIES = [
  '&amp;',
  '&lt;',
  '&gt;',
  '&quot;',
  '&nbsp;',
  '&copy;',
  '&eacute;',
  '&ouml;',
  '&#42;',
  '&#x2A;',
  '&bogus;',
  '&',
  'AT&T',
  '&#0;',
  '&notit;',
]
const URLS = [
  'https://example.com',
  'https://example.com/a_b?c=d&e=f',
  '/relative/path',
  '#anchor',
  'mailto:a@b.co',
  'javascript:alert(1)',
  '//cdn.example.com/x',
  'HTTPS://EXAMPLE.COM',
  ' https://space.example.com',
  'www.example.com',
  'http://x.com/(paren)',
]

const inline = (depth = 0) =>
  pick([
    () => pick(WORDS),
    () => pick(WORDS),
    () => pick(WORDS),
    () => ' ',
    () => ' ',
    () => `*${inline(depth + 1)}*`,
    () => `**${inline(depth + 1)}**`,
    () => `_${inline(depth + 1)}_`,
    () => `~~${inline(depth + 1)}~~`,
    () => `\`${pick(WORDS)}${pick(['', ' ', '`'])}\``,
    () => `[${inline(depth + 1)}](${pick(URLS)}${pick(['', ' "title"'])})`,
    () => `[${pick(WORDS)}][ref]`,
    () => `![${pick(WORDS)}](${pick(URLS)})`,
    () => `<${pick(URLS.filter((u) => /^[a-z]+:/.test(u)))}>`,
    () => pick(URLS),
    () => `${pick(WORDS)}@example.com`,
    () => pick(INLINE_HTML),
    () => pick(INLINE_HTML),
    () => pick(ENTITIES),
    () => `\\${pick(['*', '_', '`', '[', '\\', '<', '&', '|', 'a'])}`,
    () => `[^${pick(['1', 'note'])}]`,
    () => pick(['  \n', '\\\n', '\n']),
    () => pick(['*', '**', '_', '__', '~', '[', ']', '(', ')', '<', '>', '!', '|']),
  ])()
const line = () => many(() => inline(), 1, 8)

const block = (depth = 0) => {
  const nested = () => (depth < 3 ? block(depth + 1) : line())
  return pick([
    () => line(),
    () => line(),
    () => `${'#'.repeat(1 + rnd(6))} ${line()}`,
    () => `${line()}\n${pick(['===', '---'])}`,
    () =>
      many(
        () => `${pick(['-', '*', '+', '1.', '2)'])} ${pick(['', '[ ] ', '[x] '])}${nested().replace(/\n/g, '\n   ')}`,
        1,
        4,
        pick(['\n', '\n\n']),
      ),
    () => nested().replace(/^/gm, '> '),
    () =>
      `> [!${pick(['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'SUCCESS', 'note', 'BOGUS'])}]${pick(['', ' text'])}\n${many(() => `> ${line()}`, 0, 3, '\n>\n')}`,
    () => `\`\`\`${pick(['', 'js', 'json', 'bash', 'html', 'js extra'])}\n${line()}\n${line()}\n\`\`\``,
    () => `    ${line()}\n    ${line()}`,
    () => pick(['***', '---', '___']),
    () => {
      const cols = 1 + rnd(4)
      const row = () => `| ${many(() => line().replace(/\n/g, ' ').replace(/\|/g, '\\|'), cols, cols, ' | ')} |`
      return `${row()}\n|${many(() => pick([' --- ', ':---', '---:', ':-:']), cols, cols, '|')}|\n${many(row, 0, 3, '\n')}`
    },
    () =>
      `<${pick(['div', 'p', 'details', 'section', 'table', 'ul', 'dl', 'blockquote'])}${pick(['', ' class="c"', ' align="center"'])}>\n${pick(['<summary>**sum**</summary>', '<li>`item`</li>', '<tr><td>*cell*</td></tr>', '<dt>t</dt><dd>d</dd>', line()])}\n${pick(['', '\n'])}${nested()}\n${pick(['', '\n'])}</${pick(['div', 'p', 'details', 'section', 'table', 'ul', 'dl', 'blockquote'])}>`,
    () => `<p>${line()}</p>`,
    () => `[ref]: ${pick(URLS)}${pick(['', ' "title"'])}`,
    () => `[^${pick(['1', 'note'])}]: ${line()}`,
  ])()
}

const docs = Array.from({ length: count }, (_, i) => [
  many(() => block(), 1, 6, pick(['\n\n', '\n', '\n\n\n'])),
  `fuzz#${seed0}:${i}`,
])
writeFileSync(`${OUT}fuzz.json`, JSON.stringify(docs))
console.log(`${docs.length} documents, ${(docs.reduce((a, [d]) => a + d.length, 0) / 1e6).toFixed(1)} MB`)
