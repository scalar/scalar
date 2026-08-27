import type { ElementContent } from 'hast'

import { tokenize } from '../index'
import { hljsClass } from './hljs'
import { canonicalName, grammarFor } from './languages'

/** Default class prefix, matching highlight.js and `code.css`. */
const HLJS_PREFIX = 'hljs-'

export type ToHastOptions = {
  /**
   * Class prefix, `'hljs-'` by default.
   *
   * The scope table already spells its classes with that prefix because that is
   * what `code.css` targets, so a custom prefix is a substitution rather than a
   * concatenation.
   */
  prefix?: string | null | undefined
}

/**
 * Highlights `code` into hast element content, the shape a rehype plugin needs.
 *
 * The string renderer in `./syntax-highlight` is the right tool when the
 * destination is HTML. This exists for the rehype half of the pipeline, where
 * handing back markup would mean parsing it straight back into nodes.
 *
 * Returns `null` for a language with no registered grammar, so a caller can
 * tell "nothing to highlight" from "highlighted to nothing" and leave the
 * block alone — `rehype-highlight` reports that as a message rather than
 * silently emitting unhighlighted output.
 *
 * Adjacent ranges resolving to the same class are merged into one span, for the
 * same reason the string renderer merges them: our scope vocabulary is finer
 * than highlight.js's, so `keyword.declaration` followed by `keyword` has to
 * arrive as a single `hljs-keyword` element rather than two siblings lowlight
 * would never have produced.
 */
export const toHast = (code: string, lang: string, options: ToHastOptions = {}): ElementContent[] | null => {
  const grammar = grammarFor(canonicalName(lang))
  if (grammar === undefined) return null

  const prefix = options.prefix ?? HLJS_PREFIX
  const out: ElementContent[] = []

  let className: string | null = null
  let buffer = ''

  const flush = (): void => {
    if (buffer === '') return

    if (className === null) {
      out.push({ type: 'text', value: buffer })
    } else {
      out.push({
        type: 'element',
        tagName: 'span',
        properties: { className: [prefix === HLJS_PREFIX ? className : className.replace(HLJS_PREFIX, prefix)] },
        children: [{ type: 'text', value: buffer }],
      })
    }

    buffer = ''
  }

  for (const token of tokenize(code, grammar)) {
    const next = token.scope === null ? null : hljsClass(token.scope)
    if (next !== className) {
      flush()
      className = next
    }
    buffer += token.text
  }
  flush()

  return out
}
