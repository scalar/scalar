/**
 * Sorts a differential run's differences into known current-pipeline bugs and
 * everything else, which needs a look.
 *
 *   node bench/classify.mjs <label>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { normalize } from './normalize.mjs'
import { BASELINE_NO_REPARSE, CODE_HIGHLIGHT, OUT, PROTOTYPE } from './paths.mjs'

const require = createRequire(import.meta.url)
const { HtmlRenderer, Parser } = require('commonmark')
const NM = CODE_HIGHLIGHT + '/node_modules/'
const { unified } = await import(NM + 'unified/index.js')
const remark = unified()
  .use((await import(NM + 'remark-parse/index.js')).default)
  .use((await import(NM + 'remark-gfm/index.js')).default)
  .use((await import(NM + 'remark-rehype/index.js')).default, { allowDangerousHtml: true })
  .use((await import(NM + 'rehype-raw/index.js')).default)
  .use((await import(NM + 'rehype-stringify/index.js')).default)
  .freeze()
const prototype = await import(PROTOTYPE)
const noReparse = await import(BASELINE_NO_REPARSE)
/**
 * The difference disappears when the current pipeline skips re-parsing raw HTML fragments for
 * inline Markdown: that step, which parses each fragment alone, is the cause.
 */
/**
 * The build without that step also lacks inline Markdown inside raw HTML (that step is how the
 * current pipeline does it), so structure is compared with inline formatting and its markers removed.
 */
const structure = (html) =>
  html
    .replace(/<\/?(strong|em|code|del)>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
const fromReparse = (d) => {
  try {
    return d.diffs.every((x) => {
      const variant = normalize(
        noReparse.htmlFromMarkdown(
          d.markdown,
          x.options === 'withImages' ? { removeTags: [] } : { removeTags: ['img', 'picture'] },
        ),
      )
      return variant === x.prototype || structure(variant) === structure(x.prototype)
    })
  } catch {
    // Without that step, parse5 throws on some inputs, so it is not the cause there.
    return false
  }
}
/** The CommonMark reference implementation, and both pipelines' parsers with raw HTML passed through unsanitized. */
const reference = (md) => normalize(new HtmlRenderer().render(new Parser().parse(md)).trimEnd())
const currentParse = (md) => normalize(String(remark.processSync(md)).trimEnd())
const prototypeParse = (md) => normalize(prototype.htmlFromMarkdown(md, { unsafe: true }).trimEnd())

const EMPTIED =
  /<(a|span|b|strong|i|em|code|font|div|p|sup|sub|u|li|td|th|kbd|var|s|del|ins|q|small|big|abbr|dd|dt|summary|h[1-6])\b[^>]*><\/\1>/g
const count = (s, re) => (s.match(re) ?? []).length
const spaces = (s) => count(s, /\s/g)
const KNOWN = {
  /** A raw tag whose attributes contain a Markdown marker is closed at once, so its text falls out of it (links stop working). */
  'emptied element': ({ current, prototype }) => count(current, EMPTIED) > count(prototype, EMPTIED),
  /** Re-parsing raw HTML text trims the space next to an inline element ("is<code>x</code>"). */
  'lost space': ({ current, prototype }) =>
    current.replace(/\s/g, '') === prototype.replace(/\s/g, '') && spaces(current) < spaces(prototype),
  /** An alert followed by a list renders with empty content. */
  'empty alert': ({ current }) => /markdown-alert-content">\n<\/div>/.test(current),
  /** The current pipeline throws on the input. */
  'current pipeline throws': ({ current }) => current.startsWith('THREW'),
  /** An alert whose marker stands alone skips its first block of content. */
  'alert skips first block': ({ current, prototype }) => {
    const content = (html) =>
      [...html.matchAll(/markdown-alert-content">([\s\S]*?)<\/div>\n<\/div>/g)].map((m) =>
        m[1].replace(/<[^>]+>|\s/g, ''),
      )
    const a = content(current)
    const b = content(prototype)
    return (
      a.length > 0 &&
      a.length === b.length &&
      a.some((x, i) => x !== b[i] && b[i].endsWith(x)) &&
      a.every((x, i) => b[i].endsWith(x))
    )
  },
  /** `rehype-format` puts a space before an inline image that has none in the source. */
  'space before image': ({ current, prototype }) =>
    current.replace(/ (?=<img)/g, '') === prototype.replace(/ (?=<img)/g, '') &&
    count(current, / <img/g) > count(prototype, / <img/g),
}
/** An unclosed `<object>` or `<form>` makes the current pipeline strip everything after it. */
const swallowed = (d) =>
  /<(object|form)\b/i.test(d.markdown) &&
  d.diffs.every((x) => x.current.replace(/<[^>]+>|\s/g, '').length < x.prototype.replace(/<[^>]+>|\s/g, '').length)
/**
 * micromark itself parses the input differently from the CommonMark reference (commonmark.js),
 * and the prototype parses it like the reference. Checked on unsanitized output, so the
 * difference is in parsing, not in sanitizing.
 */
const followsReference = (markdown) => {
  try {
    const ref = reference(markdown)
    return prototypeParse(markdown) === ref && currentParse(markdown) !== ref
  } catch {
    return false
  }
}
export const BUCKETS = [
  ...Object.keys(KNOWN),
  'content after <object>/<form> lost',
  're-parsed raw HTML',
  'micromark deviates from CommonMark',
  'other',
]

/** The bucket of one difference, as produced by the differential runner. */
export const bucketOf = (d) =>
  Object.keys(KNOWN).find((name) => d.diffs.every((x) => KNOWN[name](x))) ??
  (swallowed(d)
    ? 'content after <object>/<form> lost'
    : fromReparse(d)
      ? 're-parsed raw HTML'
      : followsReference(d.markdown)
        ? 'micromark deviates from CommonMark'
        : 'other')

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const label = process.argv[2]
  const run = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
  const buckets = Object.fromEntries(BUCKETS.map((k) => [k, []]))
  for (const d of run.different) buckets[bucketOf(d)].push(d)
  console.log(
    `${label}: ${run.total} inputs, ${run.identical} identical, ${run.different.length} different, ${run.threw.length} threw, ${run.timeouts.length} timed out`,
  )
  for (const [k, list] of Object.entries(buckets)) console.log(`  ${k.padEnd(16)} ${list.length}`)
  writeFileSync(`${OUT}${label}-other-diffs.json`, JSON.stringify({ different: buckets.other }))
}
