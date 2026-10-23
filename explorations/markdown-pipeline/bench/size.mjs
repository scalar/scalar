import { writeFileSync } from 'node:fs'
import { brotliCompressSync, gzipSync } from 'node:zlib'

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
export const measure = async (name, src, { stubHighlight = true, cwd = CH } = {}) => {
  const file = `${cwd}/.mdbench-${name.replace(/\W+/g, '_')}.js`
  writeFileSync(file, src)
  const alias = stubHighlight
    ? {
        '@/rehype-highlight/shared-lowlight': stubs + '/shared-lowlight.js',
        '@/rehype-highlight': stubs + '/rehype-highlight.js',
        '@/languages': stubs + '/languages.js',
        '@/rehype-alert': CH + '/src/rehype-alert/index.ts',
      }
    : {}
  const b = await rolldown({ input: file, cwd, platform: 'browser', logLevel: 'silent', plugins: [stubPlugin(alias)] })
  const { output } = await b.generate({ format: 'es', minify: true })
  await b.close()
  const code = output[0].code
  const r = { name, raw: code.length, gz: gzipSync(code, { level: 9 }).length, br: brotliCompressSync(code).length }
  ;(await import('node:fs')).rmSync(file)
  return r
}
const SINK = 'globalThis.__sink = '
const fmt = (r) =>
  `${r.name.padEnd(48)} ${(r.raw / 1024).toFixed(1).padStart(7)} KB raw ${(r.gz / 1024).toFixed(1).padStart(6)} KB gz ${(r.br / 1024).toFixed(1).padStart(6)} KB br`
if (process.argv[2] === 'baseline') {
  const M = `import { htmlFromMarkdown, getHeadings, splitContent } from '${CH}/src/markdown/markdown.ts';`
  for (const [n, src, o] of [
    [
      'htmlFromMarkdown (no highlighter)',
      `import { htmlFromMarkdown } from '${CH}/src/markdown/markdown.ts'; ${SINK}htmlFromMarkdown`,
    ],
    ['htmlFromMarkdown+getHeadings+splitContent', `${M} ${SINK}[htmlFromMarkdown, getHeadings, splitContent]`],
    [
      'getHeadings only (remark-parse+gfm)',
      `import { getHeadings } from '${CH}/src/markdown/markdown.ts'; ${SINK}getHeadings`,
    ],
    [
      'full module with lowlight (main today)',
      `${M} ${SINK}[htmlFromMarkdown, getHeadings, splitContent]`,
      { stubHighlight: false },
    ],
  ])
    console.log(fmt(await measure(n, src, o)))
}

export { SINK, fmt }
