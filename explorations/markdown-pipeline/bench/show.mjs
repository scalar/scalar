/**
 * Prints the CommonMark reference, the current pipeline and the prototype for each argument,
 * raw (not normalized), for looking at a minimized case: `node bench/show.mjs '<markdown>' ...`.
 * Arguments are JSON string literals when they start with a quote, so escapes can be written.
 */
import { createRequire } from 'node:module'

import { normalize } from './normalize.mjs'
import { BASELINE, PROTOTYPE } from './paths.mjs'

const require = createRequire(import.meta.url)
const { HtmlRenderer, Parser } = require('commonmark')
const current = await import(BASELINE)
const prototype = await import(PROTOTYPE)
const o = { removeTags: [] }
for (const arg of process.argv.slice(2)) {
  const md = arg.startsWith('"') ? JSON.parse(arg) : arg
  const a = current.htmlFromMarkdown(md, o)
  const b = prototype.htmlFromMarkdown(md, o)
  console.log(normalize(a) === normalize(b) ? 'SAME' : 'DIFF', JSON.stringify(md))
  console.log('  ref', JSON.stringify(new HtmlRenderer().render(new Parser().parse(md))))
  console.log('  cur', JSON.stringify(a))
  console.log('  pro', JSON.stringify(b))
}
