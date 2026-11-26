import { rmSync, writeFileSync } from 'node:fs'
import { brotliCompressSync, gzipSync } from 'node:zlib'

import { rolldown } from 'rolldown'

import { BASELINE_HIGHLIGHTED_SRC, BASELINE_SRC, MARKDOWN } from './paths.mjs'

export const measure = async (name, src, { cwd = MARKDOWN } = {}) => {
  const file = `${cwd}/.mdbench-${name.replace(/\W+/g, '_')}.js`
  writeFileSync(file, src)
  const b = await rolldown({ input: file, cwd, platform: 'browser', logLevel: 'silent' })
  const { output } = await b.generate({ format: 'es', minify: true })
  await b.close()
  const code = output[0].code
  const r = { name, raw: code.length, gz: gzipSync(code, { level: 9 }).length, br: brotliCompressSync(code).length }
  rmSync(file)
  return r
}
const SINK = 'globalThis.__sink = '
const fmt = (r) =>
  `${r.name.padEnd(48)} ${(r.raw / 1024).toFixed(1).padStart(7)} KB raw ${(r.gz / 1024).toFixed(1).padStart(6)} KB gz ${(r.br / 1024).toFixed(1).padStart(6)} KB br`
if (process.argv[2] === 'baseline') {
  const M = `import { htmlFromMarkdown, getHeadings, splitContent } from '${BASELINE_SRC}';`
  for (const [n, src] of [
    [
      'htmlFromMarkdown (no highlighter)',
      `import { htmlFromMarkdown } from '${BASELINE_SRC}'; ${SINK}htmlFromMarkdown`,
    ],
    ['htmlFromMarkdown+getHeadings+splitContent', `${M} ${SINK}[htmlFromMarkdown, getHeadings, splitContent]`],
    ['getHeadings only (remark-parse+gfm)', `import { getHeadings } from '${BASELINE_SRC}'; ${SINK}getHeadings`],
    [
      'with @scalar/highlight (as shipped before)',
      `import { htmlFromMarkdown, getHeadings, splitContent } from '${BASELINE_HIGHLIGHTED_SRC}'; ${SINK}[htmlFromMarkdown, getHeadings, splitContent]`,
    ],
  ])
    console.log(fmt(await measure(n, src)))
}

export { SINK, fmt }
