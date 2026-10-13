import { escapeAttribute, escapeHtml } from '../core/render'
import { tokenize } from '../core/tokenize'
import type { CompiledGrammar } from '../core/types'
import { hljsClass } from './hljs'
import { canonicalName, grammarFor } from './languages'

export type SyntaxHighlightOptions = {
  /** Language name, in highlight.js vocabulary. */
  lang: string
  /**
   * Accepted and ignored.
   *
   * The lowlight version needs a `Record<string, LanguageFn>` because it
   * builds a fresh lowlight instance per call. Here the registry already knows
   * what is loaded, so the argument only exists to keep call sites compiling.
   */
  languages?: unknown
  /** Wrap each line in `<span class="line">` and set the gutter variables. */
  lineNumbers?: boolean
  /** Substrings to blank out behind a `.credential` span. */
  maskCredentials?: string | string[]
}

/** Opening tags, built once per class attribute rather than once per span. */
const tags = new Map<string, string>()

const openTag = (cls: string): string => {
  let tag = tags.get(cls)
  if (tag === undefined) {
    tag = `<span class="${cls}">`
    tags.set(cls, tag)
  }
  return tag
}

/**
 * Credentials shorter than this are not masked — too likely to appear inside
 * unrelated tokens, and a two-character secret is not a secret.
 */
const MIN_CREDENTIAL_LENGTH = 3

type Masked = { start: number; end: number }

/**
 * Where the credentials sit in the source, as non-overlapping ranges in order.
 *
 * Masking works on these source ranges rather than on the finished HTML. A
 * search over the HTML misses a secret the tokenizer split into several spans
 * (`sk_live.abc123` is a name, a `.` and a member), and it also matches inside
 * the markup itself — a credential that happens to read `span` or `class`
 * used to corrupt the output.
 */
const findCredentials = (code: string, credentials: string | string[] | undefined): Masked[] => {
  const list = (typeof credentials === 'string' ? [credentials] : (credentials ?? [])).filter(
    // A line break would split the masked range across line elements.
    (credential) => credential.length >= MIN_CREDENTIAL_LENGTH && !credential.includes('\n'),
  )
  const found: Masked[] = []
  for (const credential of list) {
    let at = code.indexOf(credential)
    while (at !== -1) {
      found.push({ start: at, end: at + credential.length })
      at = code.indexOf(credential, at + credential.length)
    }
  }
  // Earliest first, and the longer of two that start together.
  found.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: Masked[] = []
  for (const range of found) {
    const last = merged[merged.length - 1]
    if (last && range.start < last.end) {
      continue
    }
    merged.push(range)
  }
  return merged
}

const MASK_OPEN = '<span class="credential"><span class="credential-value">'
const MASK_CLOSE = '</span></span>'

/**
 * Renders `code` to highlight.js-shaped markup, optionally split into lines.
 *
 * One tokenizer pass over the whole string, with line breaks handled as they
 * are reached. Tokenizing line by line would be simpler and wrong: a block
 * comment or a template literal carries state across a newline, and a
 * per-line tokenizer would restart in the root state on line two.
 *
 * Adjacent ranges that resolve to the same class are merged. Our scope
 * vocabulary is finer than highlight.js's, so `keyword.declaration` followed
 * by `keyword` has to collapse into one `hljs-keyword` span rather than the
 * two neighbours lowlight would never have emitted.
 *
 * A masked credential takes the class of its first character for its whole
 * length, so it always lands inside a single span, the way a credential inside
 * a string literal did with lowlight.
 */
const render = (
  code: string,
  grammar: CompiledGrammar | undefined,
  lineMode: boolean,
  masked: Masked[],
): { html: string; count: number } => {
  const lines: string[] = []
  let line = ''

  // Pending run of same-classed ranges, flushed when the class changes.
  let cls: string | null = null
  let start = 0
  let end = 0

  // The next masked range, and the class its first character was given.
  let maskIndex = 0
  let maskClass: string | null = null

  /** Escaped text of `[from, to)`, with masked ranges wrapped. */
  const text = (from: number, to: number): string => {
    let out = ''
    let cursor = from
    for (const range of masked) {
      if (range.end <= from || range.start >= to) {
        continue
      }
      out +=
        escapeHtml(code.slice(cursor, range.start)) +
        MASK_OPEN +
        escapeHtml(code.slice(range.start, range.end)) +
        MASK_CLOSE
      cursor = range.end
    }
    return out + escapeHtml(code.slice(cursor, to))
  }

  const flush = () => {
    if (end > start) {
      const body = masked.length ? text(start, end) : escapeHtml(code.slice(start, end))
      line += cls === null ? body : `${openTag(cls)}${body}</span>`
    }
    start = end
  }

  const endLine = () => {
    flush()
    lines.push(line)
    line = ''
  }

  const place = (next: string | null, s: number, e: number) => {
    let at = s

    while (at < e) {
      const nl = lineMode ? code.indexOf('\n', at) : -1
      const stop = nl === -1 || nl >= e ? e : nl

      if (stop > at) {
        if (next !== cls || at !== end) {
          flush()
          cls = next
          start = at
        }
        end = stop
      }

      if (stop === e) {
        break
      }

      // Landed on a newline: close the line and restart after it. The newline
      // itself is written by the wrapper, not carried as token text.
      endLine()
      at = stop + 1
      cls = null
      start = at
      end = at
    }
  }

  const emit = (scope: string | null, s: number, e: number) => {
    const next = scope === null ? null : hljsClass(scope)
    // Split the range where it enters or leaves a masked range; the inside
    // parts take the class the masked range started with.
    let at = s
    while (at < e) {
      while (maskIndex < masked.length && masked[maskIndex]!.end <= at) {
        maskIndex++
      }
      const range = masked[maskIndex]
      if (range === undefined || range.start >= e) {
        place(next, at, e)
        return
      }
      if (at < range.start) {
        place(next, at, range.start)
        at = range.start
      }
      if (at === range.start) {
        maskClass = next
      }
      const stop = range.end < e ? range.end : e
      place(maskClass, at, stop)
      at = stop
    }
  }

  if (grammar) {
    tokenize(code, grammar, emit)
  } else {
    // No grammar for this language — the whole block is one unscoped range,
    // which still needs splitting into lines.
    emit(null, 0, code.length)
  }
  endLine()

  if (!lineMode) {
    return { html: lines.join(''), count: lines.length }
  }

  let html = ''
  for (const content of lines) {
    html += `<span class="line">${content}\n</span>`
  }
  return { html, count: lines.length }
}

/**
 * Drop-in replacement for `syntaxHighlight` from `@scalar/code-highlight`.
 *
 * Same signature, same `<pre><code class="hljs language-x">` envelope, same
 * `hljs-*` token classes, so `code.css` and every consumer of the returned
 * string keep working. What changes is underneath: our state machine instead
 * of a lowlight instance built per call.
 *
 * An unknown language degrades to escaped, unhighlighted code — still carrying
 * the `hljs` class, because that is what the rehype plugin leaves behind when
 * `lowlight.highlight` throws `Unknown language`.
 *
 * `lang` reaches the `class` attribute, and it is not always trusted — in a
 * docs pipeline it is the info string of a fenced block in someone else's
 * document. It is escaped rather than passed through: every real language name
 * is unchanged by that, so the envelope stays byte-identical to the lowlight
 * one, but a name carrying a quote can no longer close the attribute and open
 * an element of its own.
 */
export const syntaxHighlight = (codeString: string, options: SyntaxHighlightOptions): string => {
  const name = canonicalName(options.lang)
  const grammar = grammarFor(name)

  const lineMode = options.lineNumbers === true
  const masked = findCredentials(codeString, options.maskCredentials)
  const { html, count } = render(codeString, grammar, lineMode, masked)
  const style = lineMode ? ` style="--line-count: ${count}; --line-digits: ${count.toString().length};"` : ''

  return `<pre><code class="hljs language-${escapeAttribute(name)}"${style}>${html}</code></pre>`
}
