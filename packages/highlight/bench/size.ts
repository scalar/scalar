/**
 * Measures what an app would actually download.
 *
 * Each entry is bundled and minified with Rolldown, then gzipped — the same
 * path a real bundler takes (Rolldown is what Vite builds on in this repo).
 * Two details matter for the numbers to mean anything:
 *
 * - entries *call* the API rather than re-exporting it, so tree-shaking runs
 *   the way it would in an app. Re-exporting everything would quietly bill us
 *   for code no app pulls in.
 * - entries are written inside the project so `node_modules` resolves, which
 *   is what lets the comparison builds work at all.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { type OutputChunk, rolldown } from 'rolldown'

import { saveResults } from './results'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = join(root, '.bench-tmp')

const languages = [
  'bash',
  'c',
  'clojure',
  'cpp',
  'csharp',
  'css',
  'dart',
  'diff',
  'dockerfile',
  'elixir',
  'fsharp',
  'go',
  'graphql',
  'haskell',
  'html',
  'http',
  'ini',
  'java',
  'javascript',
  'json',
  'kotlin',
  'lua',
  'makefile',
  'markdown',
  'matlab',
  'mojo',
  'nginx',
  'objectivec',
  'ocaml',
  'perl',
  'php',
  'powershell',
  'python',
  'r',
  'ruby',
  'rust',
  'scala',
  'sql',
  'swift',
  'yaml',
]

/** Keeps Rolldown from dropping the whole program as dead code. */
const SINK = 'globalThis.__sink = '

const scenarios: [string, string][] = [
  [
    'core only (tokenize + render)',
    `import { compile, highlightWith } from '../dist/core/index.js';
     ${SINK}[compile, highlightWith];`,
  ],
  [
    'core + python',
    `import { highlight, registerLanguage } from '../dist/index.js';
     import python from '../dist/langs/python.js';
     registerLanguage(python);
     ${SINK}highlight;`,
  ],
  // What a @scalar/code-highlight consumer downloads after the swap: the
  // hljs-shaped renderer plus the languages ScalarCodeBlock actually shows.
  [
    'compat + json/javascript/bash',
    `import { syntaxHighlight } from '../dist/compat/index.js';
     import { registerLanguage } from '../dist/index.js';
     import json from '../dist/langs/json.js';
     import javascript from '../dist/langs/javascript.js';
     import bash from '../dist/langs/bash.js';
     registerLanguage(json, javascript, bash);
     ${SINK}syntaxHighlight;`,
  ],
]

/** Code-split, so the number is the initial download rather than the total. */
const lazyScenario: [string, string] = [
  'core + lazy loader (initial chunk)',
  `import { highlight } from '../dist/index.js';
   import { loadLanguage } from '../dist/lazy.js';
   ${SINK}[highlight, loadLanguage];`,
]

const comparisons: [string, string][] = [
  // What ScalarCodeBlock downloads today: the rehype pipeline, lowlight, and
  // every grammar in `standardLanguages` (bar `curl` and `mojo`, which are
  // bespoke and add a few hundred bytes).
  [
    '@scalar/code-highlight syntaxHighlight',
    `import { syntaxHighlight } from '@scalar/code-highlight/code';
     import l0 from 'highlight.js/lib/languages/bash';\n     import l1 from 'highlight.js/lib/languages/c';\n     import l2 from 'highlight.js/lib/languages/clojure';\n     import l3 from 'highlight.js/lib/languages/cpp';\n     import l4 from 'highlight.js/lib/languages/csharp';\n     import l5 from 'highlight.js/lib/languages/css';\n     import l6 from 'highlight.js/lib/languages/dart';\n     import l7 from 'highlight.js/lib/languages/diff';\n     import l8 from 'highlight.js/lib/languages/dockerfile';\n     import l9 from 'highlight.js/lib/languages/elixir';\n     import l10 from 'highlight.js/lib/languages/fsharp';\n     import l11 from 'highlight.js/lib/languages/go';\n     import l12 from 'highlight.js/lib/languages/graphql';\n     import l13 from 'highlight.js/lib/languages/haskell';\n     import l14 from 'highlight.js/lib/languages/http';\n     import l15 from 'highlight.js/lib/languages/ini';\n     import l16 from 'highlight.js/lib/languages/java';\n     import l17 from 'highlight.js/lib/languages/javascript';\n     import l18 from 'highlight.js/lib/languages/json';\n     import l19 from 'highlight.js/lib/languages/kotlin';\n     import l20 from 'highlight.js/lib/languages/less';\n     import l21 from 'highlight.js/lib/languages/lua';\n     import l22 from 'highlight.js/lib/languages/makefile';\n     import l23 from 'highlight.js/lib/languages/markdown';\n     import l24 from 'highlight.js/lib/languages/matlab';\n     import l25 from 'highlight.js/lib/languages/nginx';\n     import l26 from 'highlight.js/lib/languages/objectivec';\n     import l27 from 'highlight.js/lib/languages/ocaml';\n     import l28 from 'highlight.js/lib/languages/perl';\n     import l29 from 'highlight.js/lib/languages/php';\n     import l30 from 'highlight.js/lib/languages/plaintext';\n     import l31 from 'highlight.js/lib/languages/powershell';\n     import l32 from 'highlight.js/lib/languages/properties';\n     import l33 from 'highlight.js/lib/languages/python';\n     import l34 from 'highlight.js/lib/languages/r';\n     import l35 from 'highlight.js/lib/languages/ruby';\n     import l36 from 'highlight.js/lib/languages/rust';\n     import l37 from 'highlight.js/lib/languages/scala';\n     import l38 from 'highlight.js/lib/languages/scss';\n     import l39 from 'highlight.js/lib/languages/shell';\n     import l40 from 'highlight.js/lib/languages/sql';\n     import l41 from 'highlight.js/lib/languages/swift';\n     import l42 from 'highlight.js/lib/languages/typescript';\n     import l43 from 'highlight.js/lib/languages/xml';\n     import l44 from 'highlight.js/lib/languages/yaml';
     ${SINK}[syntaxHighlight, [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15, l16, l17, l18, l19, l20, l21, l22, l23, l24, l25, l26, l27, l28, l29, l30, l31, l32, l33, l34, l35, l36, l37, l38, l39, l40, l41, l42, l43, l44]];`,
  ],
]

const measure = async (source: string): Promise<number> => {
  const name = `entry-${Math.random().toString(36).slice(2)}.js`
  writeFileSync(join(dir, name), source)
  const bundle = await rolldown({
    input: join(dir, name),
    cwd: root,
    platform: 'browser',
    logLevel: 'silent',
  })
  try {
    const { output } = await bundle.generate({ format: 'es', minify: true })
    // A lazy loader's dynamic imports split into their own chunks, so the
    // initial download is the entry chunk alone — the rest arrives on demand.
    const entry = output.find((chunk): chunk is OutputChunk => chunk.type === 'chunk' && chunk.isEntry) ?? output[0]
    return gzipSync(entry.code, { level: 9 }).byteLength
  } finally {
    await bundle.close()
  }
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`

/** The stylesheet ships as a file, so it is measured as one rather than bundled. */
const stylesheetSize = (): number => {
  const css = readFileSync(join(root, 'src/style.css'), 'utf8')
  // Rough minification: the published file keeps its comments, a bundler's
  // CSS pipeline would not.
  const minified = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return gzipSync(Buffer.from(minified), { level: 9 }).byteLength
}

const sizes: Record<string, number> = {}
const languageSizes: Record<string, number> = {}
const comparisonSizes: Record<string, number> = {}

mkdirSync(dir, { recursive: true })
try {
  console.log('\nBundled, minified, gzipped\n')
  for (const [label, entry] of scenarios) {
    sizes[label] = await measure(entry)
    console.log(`  ${label.padEnd(34)} ${kb(sizes[label]!).padStart(9)}`)
  }
  sizes[lazyScenario[0]] = await measure(lazyScenario[1])
  console.log(`  ${lazyScenario[0].padEnd(34)} ${kb(sizes[lazyScenario[0]]!).padStart(9)}`)
  sizes['style.css (minified)'] = stylesheetSize()
  console.log(`  ${'style.css (minified)'.padEnd(34)} ${kb(sizes['style.css (minified)']!).padStart(9)}`)

  console.log('\nEach language, on top of the core\n')
  const base = await measure(
    `import { highlight, registerLanguage } from '../dist/index.js'; ${SINK}[highlight, registerLanguage];`,
  )
  for (const lang of languages) {
    const total = await measure(
      `import { highlight, registerLanguage } from '../dist/index.js';
       import grammar from '../dist/langs/${lang}.js';
       registerLanguage(grammar);
       ${SINK}highlight;`,
    )
    languageSizes[lang] = total - base
    console.log(`  ${lang.padEnd(34)} ${kb(total - base).padStart(9)}`)
  }

  console.log('\nThe package this replaces\n')
  for (const [label, entry] of comparisons) {
    try {
      comparisonSizes[label] = await measure(entry)
      console.log(`  ${label.padEnd(34)} ${kb(comparisonSizes[label]!).padStart(9)}`)
    } catch (error) {
      console.log(`  ${label.padEnd(34)} ${'failed'.padStart(9)}  ${(error as Error).message.split('\n')[0]}`)
    }
  }
  console.log()
  saveResults({ sizes, languageSizes, comparisonSizes })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
