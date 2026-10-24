/**
 * Runs the test suites of the packages that render Markdown twice, as they are
 * and with `@scalar/code-highlight`'s Markdown functions replaced by the
 * prototype, and compares the results test by test.
 *
 *   node bench/swap/tests.mjs [package,...]
 *
 * Code blocks in the swapped run are highlighted by code-highlight's own
 * `rehypeHighlight` (lowlight, with language detection), so highlighting is
 * the same in both runs and only the Markdown rendering differs.
 *
 * The configs have to live in each package so their imports resolve, so they
 * are written there for the run and removed afterwards.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { OUT, ROOT } from '../paths.mjs'

const PACKAGES = {
  components: 'vitest.config.ts',
  'api-reference': 'vitest.config.ts',
  'openapi-to-markdown': 'vitest.config.ts',
}
const PROTOTYPE_SRC = new URL('../../src/index.ts', import.meta.url).pathname
const CODE_HIGHLIGHT = `${ROOT}packages/code-highlight/dist/index.js`
const SHIM = `${OUT}markdown-test-shim.ts`
const pnpmPackage = (name) => {
  const store = `${ROOT}node_modules/.pnpm/`
  const dir = execFileSync('ls', [store], { encoding: 'utf8' })
    .split('\n')
    .find((d) => d.startsWith(`${name}@`))
  return `${store}${dir}/node_modules/${name}/index.js`
}

writeFileSync(
  SHIM,
  `export * from ${JSON.stringify(CODE_HIGHLIGHT)}
import { rehypeHighlight, standardLanguages } from ${JSON.stringify(CODE_HIGHLIGHT)}
import { createLowlight } from ${JSON.stringify(pnpmPackage('lowlight'))}
import { toHtml } from ${JSON.stringify(pnpmPackage('hast-util-to-html'))}
import { type HtmlFromMarkdownOptions, getHeadings, htmlFromMarkdown as render, isHeading, splitContent, textFromNode } from ${JSON.stringify(PROTOTYPE_SRC)}

const transform = rehypeHighlight({ lowlight: createLowlight(standardLanguages), detect: true, className: 'custom-scroll' })
const file = { message: () => undefined }

/** One code block through the same highlighter as today, read back as the prototype's highlight result. */
const highlight = (code: string, lang: string | null) => {
  const node: any = { type: 'element', tagName: 'code', properties: { className: lang ? ['language-' + lang] : [] }, children: [{ type: 'text', value: code + '\\n' }] }
  transform({ type: 'root', children: [{ type: 'element', tagName: 'pre', properties: {}, children: [node] }] } as any, file as any)
  const classes: string[] = node.properties.className
  if (!classes.includes('hljs')) { return null }
  const language = classes.find((c) => c.startsWith('language-'))
  return { html: toHtml({ type: 'root', children: node.children }), lang: language ? language.slice(9) : null }
}

export const htmlFromMarkdown = (markdown: string, options?: HtmlFromMarkdownOptions): string => render(markdown, { ...options, highlight })
export { getHeadings, isHeading, splitContent, textFromNode }
`,
)

const config = (base, swap) => `
import { mergeConfig } from 'vitest/config'
import base from './${base}'

export default mergeConfig(base, {
  plugins: [
    {
      name: 'markdown-swap',
      enforce: 'pre',
      resolveId(id: string) {
        if (!${swap}) { return null }
        if (id === '@scalar/code-highlight' || id === '@scalar/code-highlight/markdown') { return ${JSON.stringify(SHIM)} }
        return null
      },
    },
  ],
})
`

const run = (pkg, swap) => {
  const dir = `${ROOT}packages/${pkg}`
  const file = join(dir, '.markdown-swap.vitest.config.ts')
  const out = `${OUT}tests-${pkg}-${swap ? 'prototype' : 'current'}.json`
  writeFileSync(file, config(PACKAGES[pkg], swap))
  try {
    const t0 = Date.now()
    try {
      execFileSync('npx', ['vitest', 'run', '-c', file, '--reporter=json', `--outputFile=${out}`], {
        cwd: dir,
        stdio: ['ignore', 'ignore', 'ignore'],
        timeout: 3_600_000,
      })
    } catch {
      // Failing tests exit non-zero; the report says which.
    }
    if (!existsSync(out)) throw new Error(`no report for ${pkg} (${swap ? 'prototype' : 'current'})`)
    process.stdout.write(`${pkg} ${swap ? 'prototype' : 'current'}: ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)
  } finally {
    rmSync(file, { force: true })
  }
  const report = JSON.parse(readFileSync(out, 'utf8'))
  const results = new Map()
  for (const suite of report.testResults) {
    if (suite.assertionResults.length === 0) results.set(`${suite.name} (file)`, suite.status)
    for (const t of suite.assertionResults) {
      results.set(`${suite.name.replace(dir + '/', '')} > ${t.fullName}`, {
        status: t.status,
        message: t.failureMessages?.[0],
      })
    }
  }
  return results
}

const status = (r) => (typeof r === 'string' ? r : r?.status)
for (const pkg of (process.argv[2] ?? Object.keys(PACKAGES).join(',')).split(',')) {
  const current = run(pkg, false)
  const prototype = run(pkg, true)
  const count = (m, s) => [...m.values()].filter((r) => status(r) === s).length
  console.log(
    `${pkg}: current ${count(current, 'passed')} passed, ${count(current, 'failed')} failed; prototype ${count(prototype, 'passed')} passed, ${count(prototype, 'failed')} failed`,
  )
  for (const [name, r] of prototype) {
    if (status(r) !== status(current.get(name))) {
      console.log(`  ${status(current.get(name))} -> ${status(r)}: ${name}`)
      if (r?.message) console.log(`      ${r.message.split('\n').slice(0, 6).join('\n      ')}`)
    }
  }
}
