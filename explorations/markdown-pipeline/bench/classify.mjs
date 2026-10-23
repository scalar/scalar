/**
 * Sorts a differential run's differences into known current-pipeline bugs and
 * everything else, which needs a look.
 *
 *   node bench/classify.mjs <label>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

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
const fromReparse = (d) => {
  try {
    return d.diffs.every(
      (x) =>
        normalize(
          noReparse.htmlFromMarkdown(
            d.markdown,
            x.options === 'withImages' ? { removeTags: [] } : { removeTags: ['img', 'picture'] },
          ),
        ) === x.prototype,
    )
  } catch {
    // Without that step, parse5 throws on some inputs, so it is not the cause there.
    return false
  }
}
/** The CommonMark reference implementation, and both pipelines' parsers with raw HTML passed through unsanitized. */
const reference = (md) => normalize(new HtmlRenderer().render(new Parser().parse(md)).trimEnd())
const currentParse = (md) => normalize(String(remark.processSync(md)).trimEnd())
const prototypeParse = (md) => normalize(prototype.htmlFromMarkdown(md, { unsafe: true }).trimEnd())

const label = process.argv[2]
const run = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
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
const buckets = Object.fromEntries(
  [
    ...Object.keys(KNOWN),
    'content after <object>/<form> lost',
    're-parsed raw HTML',
    'micromark deviates from CommonMark',
    'other',
  ].map((k) => [k, []]),
)
for (const d of run.different) {
  const k =
    Object.keys(KNOWN).find((name) => d.diffs.every((x) => KNOWN[name](x))) ??
    (swallowed(d)
      ? 'content after <object>/<form> lost'
      : fromReparse(d)
        ? 're-parsed raw HTML'
        : followsReference(d.markdown)
          ? 'micromark deviates from CommonMark'
          : 'other')
  buckets[k].push(d)
}
console.log(
  `${label}: ${run.total} inputs, ${run.identical} identical, ${run.different.length} different, ${run.threw.length} threw, ${run.timeouts.length} timed out`,
)
for (const [k, list] of Object.entries(buckets)) console.log(`  ${k.padEnd(16)} ${list.length}`)
writeFileSync(`${OUT}${label}-other-diffs.json`, JSON.stringify({ different: buckets.other }))
