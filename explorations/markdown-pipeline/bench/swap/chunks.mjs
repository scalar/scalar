/**
 * For the code-split (`es`) builds: which chunks load up front (the static
 * import closure of the entry) and which only on demand, and where the
 * Markdown stack ends up.
 */
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

import { OUT } from '../paths.mjs'

const MARKDOWN =
  /node_modules\/\.pnpm\/(unified|micromark|mdast-util|hast-util|remark-|rehype-|parse5|lowlight|highlight\.js|vfile|unist-util|property-information|character-entities|decode-named|stringify-entities)|code-highlight\/dist|packages\/markdown\/dist|markdown-pipeline\/src|openapi-to-markdown|asyncapi-to-markdown/

const LABEL = process.argv[3] ?? 'main'
for (const mode of (process.argv[2] ?? 'main,prototype,prototype-no-copy').split(',')) {
  const dir = `${OUT}standalone-${LABEL}-${mode}-es/`
  const stats = JSON.parse(readFileSync(dir + 'webpack-stats.json', 'utf8'))
  const fileOf = Object.fromEntries(stats.chunks.map((c) => [c.id, c.files[0]]))
  const gz = (f) => gzipSync(readFileSync(dir + f), { level: 9 }).length
  // Static imports only: `import ... from "./x.js"` / `export ... from`, not `import("./x.js")`.
  const staticDeps = (f) =>
    [
      ...readFileSync(dir + f, 'utf8').matchAll(
        /(?:^|[;\n}])\s*(?:import|export)\s*(?:[^'"()]*?\sfrom\s*)?["']\.\/([^"']+\.js)["']/g,
      ),
    ].map((m) => m[1])
  const initial = new Set()
  const visit = (f) => {
    if (initial.has(f)) return
    initial.add(f)
    for (const d of staticDeps(f)) visit(d)
  }
  visit('standalone.js')
  const files = [...new Set(Object.values(fileOf))].filter((f) => f.endsWith('.js'))
  const sum = (list) => list.reduce((a, f) => a + gz(f), 0)
  // Markdown-stack bytes per chunk, from module sizes (pre-minify), as a share of each chunk.
  const mdShare = {}
  for (const m of stats.modules) {
    for (const c of m.chunks) {
      const f = fileOf[c]
      mdShare[f] ??= [0, 0]
      mdShare[f][1] += m.size
      if (MARKDOWN.test(m.name)) mdShare[f][0] += m.size
    }
  }
  const mdChunks = files.filter((f) => (mdShare[f]?.[0] ?? 0) > 2000)
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`
  console.log(
    `\n${LABEL} ${mode}: up front ${initial.size} chunks, ${kb(sum([...initial]))} gzip; on demand ${files.length - initial.size} chunks, ${kb(sum(files.filter((f) => !initial.has(f))))} gzip`,
  )
  for (const f of mdChunks.sort((a, b) => gz(b) - gz(a))) {
    const [md, all] = mdShare[f]
    console.log(
      `  ${(initial.has(f) ? 'up front ' : 'on demand').padEnd(10)} ${f.padEnd(44)} ${kb(gz(f)).padStart(9)} gzip, ${((100 * md) / all).toFixed(0).padStart(3)}% markdown stack`,
    )
  }
}
