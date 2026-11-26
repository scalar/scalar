import { languages, registerLanguage } from '@scalar/highlight/all'
import { canonicalName, grammarFor, syntaxHighlight } from '@scalar/highlight/compat'

import type { Highlighter } from '../pipeline'

/**
 * Registers every bundled grammar once, when this module loads.
 *
 * A bare `import '@scalar/highlight/all'` would register them too, but a
 * side-effect-only import of an external package is what a library build is
 * allowed to drop. A named import keeps a binding the bundler can see used.
 */
registerLanguage(...languages)

const CLOSE = '</code></pre>'

/**
 * Highlights a code block with `@scalar/highlight`, emitting the same `hljs-*`
 * classes as `rehypeHighlight`, so `code.css` styles the result unchanged.
 *
 * `syntaxHighlight` wraps its output in `<pre><code>`, and the renderer writes
 * its own envelope, so only the markup between the two is kept. A language with
 * no grammar returns `null` and the block stays plain text.
 */
export const highlight: Highlighter = (code, lang) => {
  if (!grammarFor(canonicalName(lang))) {
    return null
  }

  const html = syntaxHighlight(code, { lang })
  return html.slice(html.indexOf('>', html.indexOf('<code')) + 1, html.length - CLOSE.length)
}
