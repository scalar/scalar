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
 */
const render = (
  code: string,
  grammar: CompiledGrammar | undefined,
  lineMode: boolean,
): { html: string; count: number } => {
  const lines: string[] = []
  let line = ''

  // Pending run of same-classed ranges, flushed when the class changes.
  let cls: string | null = null
  let start = 0
  let end = 0

  const flush = () => {
    if (end > start) {
      const text = escapeHtml(code.slice(start, end))
      line += cls === null ? text : `${openTag(cls)}${text}</span>`
    }
    start = end
  }

  const endLine = () => {
    flush()
    lines.push(line)
    line = ''
  }

  const emit = (scope: string | null, s: number, e: number) => {
    const next = scope === null ? null : hljsClass(scope)
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

      if (stop === e) break

      // Landed on a newline: close the line and restart after it. The newline
      // itself is written by the wrapper, not carried as token text.
      endLine()
      at = stop + 1
      cls = null
      start = at
      end = at
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

  if (!lineMode) return { html: lines.join(''), count: lines.length }

  let html = ''
  for (const content of lines) html += `<span class="line">${content}\n</span>`
  return { html, count: lines.length }
}

/**
 * Credentials shorter than this are not masked — too likely to appear inside
 * unrelated tokens, and a two-character secret is not a secret.
 */
const MIN_CREDENTIAL_LENGTH = 3

/**
 * Replaces credential substrings in the finished HTML.
 *
 * Post-processing the serialized string, rather than the token stream, is what
 * `@scalar/code-highlight` does. It is kept here deliberately: a credential
 * that straddles a token boundary masks or fails to mask exactly as it does
 * today, so a swap cannot change what is visible on screen.
 */
const applyCredentialMask = (html: string, credentials: string | string[] | undefined): string => {
  const list = (typeof credentials === 'string' ? [credentials] : (credentials ?? [])).filter(
    (credential) => credential.length >= MIN_CREDENTIAL_LENGTH,
  )

  if (!list.length) return html

  return list.reduce(
    (acc, credential) =>
      acc.split(credential).join(`<span class="credential"><span class="credential-value">${credential}</span></span>`),
    html,
  )
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
  const { html, count } = render(codeString, grammar, lineMode)
  const style = lineMode ? ` style="--line-count: ${count}; --line-digits: ${count.toString().length};"` : ''

  return applyCredentialMask(
    `<pre><code class="hljs language-${escapeAttribute(name)}"${style}>${html}</code></pre>`,
    options.maskCredentials,
  )
}
