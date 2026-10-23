import { rmSync, writeFileSync } from 'node:fs'

import { rolldown } from 'rolldown'

import { CODE_HIGHLIGHT, HERE } from './paths.mjs'

const stubPlugin = (alias) => ({
  name: 'stub',
  resolveId(id) {
    if (alias[id]) return alias[id]
    for (const [k, v] of Object.entries(alias)) if (k === '@' && id.startsWith('@/')) return null
    return null
  },
})
const CH = CODE_HIGHLIGHT
const stubs = HERE + 'stubs'
const file = `${CH}/.mdbench-compose.js`
writeFileSync(
  file,
  `import { htmlFromMarkdown } from '${CH}/src/markdown/markdown.ts'; globalThis.__sink = htmlFromMarkdown`,
)
const alias = {
  '@/rehype-highlight/shared-lowlight': stubs + '/shared-lowlight.js',
  '@/rehype-highlight': stubs + '/rehype-highlight.js',
  '@/languages': stubs + '/languages.js',
  '@/rehype-alert': CH + '/src/rehype-alert/index.ts',
}
const b = await rolldown({ input: file, platform: 'browser', logLevel: 'silent', plugins: [stubPlugin(alias)] })
const { output } = await b.generate({ format: 'es', minify: true })
rmSync(file)
const by = {}
for (const [id, m] of Object.entries(output[0].modules)) {
  const mm = id.match(/node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/)
  const k = mm ? mm[1] : id.replace(CH, 'code-highlight')
  by[k] = (by[k] ?? 0) + m.renderedLength
}
const groups = {
  'parse5 (HTML parser, via rehype-raw/rehype-parse)':
    /^parse5|hast-util-from-parse5|hast-util-raw|hast-util-to-parse5|entities/,
  'character-entities (HTML entity tables)': /character-entities|decode-named|character-reference|stringify-entities/,
  'micromark + gfm (markdown tokenizer)': /^micromark/,
  'mdast-util-* (tokens -> mdast)': /^mdast-util/,
  'hast-util-* / rehype plugins':
    /^hast-util|^rehype|^hastscript|^property-information|^html-|^space-separated|^comma-separated|^web-namespaces|^zwitch|^html-void|^hast/,
  'unified / vfile / unist':
    /^unified|^vfile|^unist|^bail|^trough|^is-plain|^extend|^devlop|^trim-lines|^ccount|^escape-string|^longest|^markdown-table|^decode|^ms$|^debug|^supports-color/,
}
const tot = {}
for (const [k, v] of Object.entries(by)) {
  const g = Object.entries(groups).find(([, r]) => r.test(k))?.[0] ?? `other: ${k}`
  tot[g] = (tot[g] ?? 0) + v
}
const sum = Object.values(tot).reduce((a, b) => a + b, 0)
for (const [k, v] of Object.entries(tot).sort((a, b) => b[1] - a[1]))
  console.log((v / 1024).toFixed(1).padStart(7), 'KB', ((100 * v) / sum).toFixed(0).padStart(3) + '%', k)
console.log('top packages:')
for (const [k, v] of Object.entries(by)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 14))
  console.log('  ', (v / 1024).toFixed(1).padStart(6), k)
