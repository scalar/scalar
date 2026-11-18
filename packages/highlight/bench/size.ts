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
 * - entries are written inside the project so relative `../dist` imports
 *   resolve the way they would from an installed copy.
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
  'julia',
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
  // What ScalarCodeBlock downloads: the hljs-shaped renderer plus the
  // languages it shows most often.
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
  console.log()
  saveResults({ sizes, languageSizes })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
