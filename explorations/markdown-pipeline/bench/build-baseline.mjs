import { readFileSync, rmSync, writeFileSync } from 'node:fs'

import { rolldown } from 'rolldown'

import { BASELINE, BASELINE_HIGHLIGHTED, BASELINE_NO_REPARSE, CODE_HIGHLIGHT, HERE } from './paths.mjs'

const CH = CODE_HIGHLIGHT
const stubs = HERE + 'stubs'
const alias = {
  '@/rehype-highlight/shared-lowlight': stubs + '/shared-lowlight.js',
  '@/rehype-highlight': stubs + '/rehype-highlight.js',
  '@/languages': stubs + '/languages.js',
  '@/rehype-alert': CH + '/src/rehype-alert/index.ts',
}
const file = `${CH}/.mdbench-node.js`
writeFileSync(file, `export * from '${CH}/src/markdown/markdown.ts'`)
const b = await rolldown({
  input: file,
  platform: 'node',
  logLevel: 'silent',
  plugins: [{ name: 'stub', resolveId: (id) => alias[id] ?? null }],
})
await b.write({ file: BASELINE, format: 'es' })

// The same pipeline with its real lowlight highlighter, for comparing highlighted code blocks.
const h = await rolldown({ input: file, cwd: CH, platform: 'node', logLevel: 'silent' })
await h.write({ file: BASELINE_HIGHLIGHTED, format: 'es' })
rmSync(file)

// The same pipeline without the step that re-parses raw HTML fragments for inline Markdown,
// to attribute differences to that step: where the prototype matches this build, it is the cause.
const source = readFileSync(`${CH}/src/markdown/markdown.ts`, 'utf8')
if (!source.includes('.use(transformInlineMarkdownInRawHtml)')) throw new Error('re-parse step not found')
const variant = `${CH}/src/markdown/.markdown-no-reparse.ts`
writeFileSync(variant, source.replace('.use(transformInlineMarkdownInRawHtml)', ''))
writeFileSync(file, `export * from '${variant}'`)
try {
  const n = await rolldown({
    input: file,
    platform: 'node',
    logLevel: 'silent',
    plugins: [{ name: 'stub', resolveId: (id) => alias[id] ?? null }],
  })
  await n.write({ file: BASELINE_NO_REPARSE, format: 'es' })
} finally {
  rmSync(file)
  rmSync(variant)
}
