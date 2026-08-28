import { scopeClass } from './scopes'
import { tokenize } from './tokenize'
import type { CompiledGrammar } from './types'

export type RenderOptions = {
  /**
   * Prefix for generated class names. Must match the stylesheet — change it
   * only alongside a stylesheet of your own.
   */
  classPrefix?: string
  /**
   * Wrap each line in its own element, which is what makes line numbers,
   * line highlighting and per-line diff gutters possible.
   */
  lines?: boolean
  /** Line numbers (1-based) to mark with `data-hl`. */
  highlightLines?: readonly number[]
}

/**
 * `s`calar `h`igh`l`ight.
 *
 * This string is repeated on every span in the output, so its length is a real
 * share of the rendered HTML — on the JavaScript sample it lands on 233 of
 * them. Short, but still namespaced: a bare `hl-` would be a plausible utility
 * class in the page around the block, and colliding with one would restyle
 * someone else's markup.
 */
export const DEFAULT_PREFIX = 'shl-'

const AMP = 38
const LT = 60
const GT = 62

/**
 * Escapes `&`, `<` and `>`.
 *
 * Most token text contains none of them, so the scan returns the original
 * string without allocating. Quotes are left alone: token text only ever lands
 * in element content, never in an attribute.
 */
export const escapeHtml = (s: string): string => {
  let out = ''
  let last = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c !== AMP && c !== LT && c !== GT) continue
    out += s.slice(last, i) + (c === AMP ? '&amp;' : c === LT ? '&lt;' : '&gt;')
    last = i + 1
  }
  return last === 0 ? s : out + s.slice(last)
}

/**
 * Escapes a value destined for a double-quoted attribute.
 *
 * `escapeHtml` deliberately leaves quotes alone because token text only ever
 * lands in element content. Options do not: `classPrefix`, `className` and the
 * language name are interpolated into `class` and `data-lang`, where a `"`
 * would close the attribute and let the rest of the value become markup.
 */
export const escapeAttribute = (s: string): string => {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

/**
 * Opening tags, built once per scope instead of once per span.
 *
 * Punctuation alone accounts for a large share of the spans in a typical file,
 * so the per-span work is worth keeping to a concatenation and nothing else.
 */
const tagCache = new Map<string, Map<string, string>>()

const tagsFor = (prefix: string): Map<string, string> => {
  let tags = tagCache.get(prefix)
  if (tags === undefined) {
    tags = new Map()
    tagCache.set(prefix, tags)
  }
  return tags
}

const openTag = (tags: Map<string, string>, prefix: string, scope: string): string => {
  let tag = tags.get(scope)
  if (tag === undefined) {
    tag = `<span class="${prefix}${scopeClass(scope)}">`
    tags.set(scope, tag)
  }
  return tag
}

/**
 * Highlights `code` to an HTML fragment — the inner content of a `<code>`
 * element, with no wrapper of its own.
 *
 * Adjacent ranges sharing a scope are merged into one span, and unscoped text
 * is written bare, so the output stays close to the minimum markup needed.
 */
export const highlight = (code: string, grammar: CompiledGrammar, options: RenderOptions = {}): string => {
  const prefix = escapeAttribute(options.classPrefix ?? DEFAULT_PREFIX)
  if (options.lines) return renderLines(code, grammar, prefix, options.highlightLines).html

  const tags = tagsFor(prefix)
  let out = ''
  // Pending run of same-scoped ranges, flushed when the scope changes.
  let scope: string | null = null
  let from = 0
  let to = 0

  tokenize(code, grammar, (s, start, end) => {
    if (s === scope && start === to) {
      to = end
      return
    }
    if (to > from) {
      const text = escapeHtml(code.slice(from, to))
      out += scope === null ? text : `${openTag(tags, prefix, scope)}${text}</span>`
    }
    scope = s
    from = start
    to = end
  })
  if (to > from) {
    const text = escapeHtml(code.slice(from, to))
    out += scope === null ? text : `${openTag(tags, prefix, scope)}${text}</span>`
  }

  return out
}

const span = (code: string, scope: string | null, from: number, to: number, prefix: string): string => {
  const text = escapeHtml(code.slice(from, to))
  return scope === null ? text : `${openTag(tagsFor(prefix), prefix, scope)}${text}</span>`
}

/**
 * Renders one element per line.
 *
 * The newline character lives *inside* each line element rather than between
 * them. Both details are load-bearing:
 *
 * - between block-level elements, a newline in a `white-space: pre` container
 *   renders as an extra empty line, doubling the height of every line
 * - without it entirely, an empty line contributes nothing to a selection, so
 *   copying the block silently drops every blank line
 *
 * Inside the element, the break is consumed by the line box it belongs to and
 * still lands in the clipboard.
 */
const renderLines = (
  code: string,
  grammar: CompiledGrammar,
  prefix: string,
  highlightLines: readonly number[] | undefined,
): { html: string; count: number } => {
  const marked = highlightLines?.length ? new Set(highlightLines) : null
  const lines: string[] = []
  let line = ''

  let scope: string | null = null
  let from = 0
  let to = 0

  const flush = () => {
    if (to > from) line += span(code, scope, from, to, prefix)
    from = to
  }
  const endLine = () => {
    flush()
    lines.push(line)
    line = ''
  }

  tokenize(code, grammar, (s, start, end) => {
    let at = start
    while (at < end) {
      const nl = code.indexOf('\n', at)
      const stop = nl === -1 || nl >= end ? end : nl
      if (stop > at) {
        if (s !== scope || at !== to) {
          flush()
          scope = s
          from = at
        }
        to = stop
      }
      if (stop === end) break
      endLine()
      at = stop + 1
      scope = null
      from = at
      to = at
    }
  })
  endLine()

  // A trailing newline in the source closes the last line rather than starting
  // an empty one.
  const endsWithNewline = code.endsWith('\n')
  if (endsWithNewline && lines[lines.length - 1] === '') lines.pop()

  let out = ''
  for (let i = 0; i < lines.length; i++) {
    const hl = marked?.has(i + 1) ? ' data-hl' : ''
    const br = i < lines.length - 1 || endsWithNewline ? '\n' : ''
    out += `<span class="${prefix}line"${hl}>${lines[i]}${br}</span>`
  }
  // The count is the number of rendered line elements, which is exactly what
  // the gutter needs — no second scan of the source to size it.
  return { html: out, count: lines.length }
}

export type BlockOptions = RenderOptions & {
  /** Render a line-number gutter. Implies `lines`. */
  lineNumbers?: boolean
  /** Extra classes on the `<pre>`. */
  className?: string
  /** Sets `data-lang`, which the theme can surface as a corner label. */
  showLanguage?: boolean
}

/**
 * Highlights `code` into a complete, themeable `<pre>` block.
 *
 * The wrapper carries no colors of its own — everything comes from the
 * stylesheet a theme generates, so the same HTML can be restyled (or switched
 * between light and dark) without re-highlighting.
 */
export const highlightBlock = (code: string, grammar: CompiledGrammar, options: BlockOptions = {}): string => {
  const prefix = escapeAttribute(options.classPrefix ?? DEFAULT_PREFIX)
  const block = `${prefix}code`
  const lined = options.lines || options.lineNumbers

  // Render once. When lined, the renderer already splits the source into line
  // elements, so it hands back the count too — no second scan to size the
  // gutter, and no separate line-counter that could drift from the split.
  let inner: string
  let count = 1
  if (lined) {
    const rendered = renderLines(code, grammar, prefix, options.highlightLines)
    inner = rendered.html
    count = rendered.count
  } else {
    inner = highlight(code, grammar, options)
  }

  const classes = [
    block,
    lined ? `${block}-lined` : '',
    options.lineNumbers ? `${block}-numbered` : '',
    options.className ? escapeAttribute(options.className) : '',
  ]
    .filter(Boolean)
    .join(' ')
  const langAttr = options.showLanguage ? ` data-lang="${escapeAttribute(grammar.name)}"` : ''

  // The gutter is sized for the widest number in the block, not per line, so
  // the code starts at the same column on line 9 and line 10. CSS counters
  // cannot measure that themselves — the stylesheet reads this variable.
  const gutter = options.lineNumbers ? ` style="--shl-line-digits: ${count.toString().length}"` : ''

  return `<pre class="${classes}"${langAttr}${gutter}><code>${inner}</code></pre>`
}
