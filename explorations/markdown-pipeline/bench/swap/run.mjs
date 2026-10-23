/**
 * Builds the real API Reference standalone bundle with and without the
 * prototype, and reports what each one ships.
 *
 * - `main`: as shipped
 * - `prototype`: `@scalar/code-highlight` swapped for the prototype
 * - `prototype-no-copy`: also stubs the "Copy as Markdown" packages, which
 *   still use unified, to show what remains once they move too
 *
 * `umd` is `standalone.js` as published. `es` builds the same entry with code
 * splitting, which approximates what an app bundling the ESM package loads up
 * front (dynamic imports become separate chunks).
 *
 * `--repo <path>` measures another checkout, such as #10739's branch, where
 * the pipeline lives in `@scalar/markdown`. There only rendering imports are
 * swapped: the "Copy as Markdown" packages keep the real module, which they
 * use for HTML to Markdown.
 *
 * The config has to live in `packages/api-reference` so its imports resolve,
 * so it is written there for the build and removed afterwards.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'

import { OUT, ROOT } from '../paths.mjs'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args.splice(i, 2)[1]
}
const REPO = (flag('--repo') ?? ROOT).replace(/\/?$/, '/')
const LABEL = flag('--label') ?? 'main'
const API_REFERENCE = REPO + 'packages/api-reference'
const COMPONENTS = REPO + 'packages/components/src/index.ts'
const HERE = new URL('.', import.meta.url).pathname
const CONFIG = join(API_REFERENCE, '.markdown-swap.vite.config.ts')
const SHIM = `${OUT}markdown-shim.ts`
const PROTOTYPE_SRC = new URL('../../src/index.ts', import.meta.url).pathname

/** The prototype under the rendering exports. Code blocks use `@scalar/highlight`, which `ScalarCodeBlock` already ships. */
writeFileSync(
  SHIM,
  `import { syntaxHighlight } from '@scalar/highlight/compat'
import { type HtmlFromMarkdownOptions, getHeadings, htmlFromMarkdown as render, isHeading, splitContent, textFromNode } from ${JSON.stringify(PROTOTYPE_SRC)}

const highlight = (code: string, lang: string | null) => {
  if (!lang) { return null }
  try {
    const html = syntaxHighlight(code, { lang })
    return { html: html.slice(html.indexOf('>', html.indexOf('<code')) + 1, html.lastIndexOf('</code>')) }
  } catch {
    return null
  }
}

export const htmlFromMarkdown = (markdown: string, options?: HtmlFromMarkdownOptions): string => render(markdown, { ...options, highlight })
export { getHeadings, isHeading, splitContent, textFromNode }
`,
)

const config = (mode, format) => `
import type { Plugin } from 'vite'
import { mergeConfig } from 'vite'
import base from './vite.standalone.config'

const swap: Plugin = {
  name: 'markdown-swap',
  enforce: 'pre',
  resolveId(id, importer) {
    if (${JSON.stringify(mode)} === 'main') { return null }
    // Resolve the shim's own import the way @scalar/components does, so there is one copy of the highlighter.
    if (importer === ${JSON.stringify(SHIM)} && id === '@scalar/highlight/compat') { return this.resolve(id, ${JSON.stringify(COMPONENTS)}, { skipSelf: true }) }
    const toMarkdown = /(openapi|asyncapi)-to-markdown/.test(importer ?? '')
    if (id === '@scalar/code-highlight' || id === '@scalar/code-highlight/markdown' || (id === '@scalar/markdown' && !toMarkdown)) { return ${JSON.stringify(SHIM)} }
    if (${JSON.stringify(mode)} === 'prototype-no-copy' && /^@scalar\\/(openapi|asyncapi)-to-markdown\\/browser$/.test(id)) { return ${JSON.stringify(HERE + 'empty.ts')} }
    return null
  },
}
const config = mergeConfig(base, {
  plugins: [swap],
  build: { outDir: ${JSON.stringify(`${OUT}standalone-${LABEL}-${mode}-${format}`)}, emptyOutDir: true, sourcemap: false },
})
// mergeConfig concatenates arrays, so the format is set afterwards.
config.build.lib.formats = [${JSON.stringify(format)}]
export default config
`

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const measure = (dir) => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.js'))
  const entry = files.find((f) => f === 'standalone.js') ?? files.find((f) => /^standalone/.test(f))
  const size = (f) => {
    const code = readFileSync(join(dir, f))
    return { raw: code.length, gz: gzipSync(code, { level: 9 }).length, br: brotliCompressSync(code).length }
  }
  const total = files.reduce((a, f) => a + statSync(join(dir, f)).size, 0)
  return { entry: size(entry), chunks: files.length, total }
}

const modes = (args[0] ?? 'main,prototype,prototype-no-copy').split(',')
const formats = (args[1] ?? 'umd,es').split(',')
const rows = []
try {
  for (const format of formats) {
    for (const mode of modes) {
      writeFileSync(CONFIG, config(mode, format))
      process.stdout.write(`building ${LABEL} ${mode} (${format})… `)
      const t0 = Date.now()
      execFileSync('npx', ['vite', 'build', '-c', CONFIG, '--logLevel', 'error'], {
        cwd: API_REFERENCE,
        stdio: ['ignore', 'ignore', 'inherit'],
      })
      console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`)
      rows.push({ mode, format, ...measure(`${OUT}standalone-${LABEL}-${mode}-${format}`) })
    }
  }
} finally {
  rmSync(CONFIG, { force: true })
}

console.log(
  `\n${'build'.padEnd(30)} ${'entry raw'.padStart(11)} ${'entry gzip'.padStart(11)} ${'entry br'.padStart(10)} ${'chunks'.padStart(7)} ${'all JS raw'.padStart(11)}`,
)
for (const r of rows) {
  const base = rows.find((x) => x.format === r.format && x.mode === 'main')
  const d = (k) => (r === base ? '' : ` (${(((r.entry[k] - base.entry[k]) / base.entry[k]) * 100).toFixed(1)}%)`)
  console.log(
    `${`${LABEL} ${r.mode} ${r.format}`.padEnd(30)} ${kb(r.entry.raw).padStart(11)} ${kb(r.entry.gz).padStart(11)} ${kb(r.entry.br).padStart(10)} ${String(r.chunks).padStart(7)} ${kb(r.total).padStart(11)}`,
  )
  if (r !== base)
    console.log(`${''.padEnd(30)} ${d('raw').padStart(11)} ${d('gz').padStart(11)} ${d('br').padStart(10)}`)
}
writeFileSync(`${OUT}standalone-sizes-${LABEL}.json`, JSON.stringify(rows, null, 2))
