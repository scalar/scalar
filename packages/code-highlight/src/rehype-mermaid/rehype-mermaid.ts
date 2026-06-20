import type { Element, Root } from 'hast'
import { toText } from 'hast-util-to-text'
import { visit } from 'unist-util-visit'

/**
 * Class name applied to the placeholder element that holds a Mermaid diagram source.
 *
 * The actual diagram is rendered on the client (Mermaid needs a browser to measure text and lay
 * out the SVG), so this plugin only emits a stable placeholder that keeps the source as plain text.
 * Consumers find these elements after the HTML is in the DOM and swap in the rendered SVG.
 */
const MERMAID_DIAGRAM_CLASS = 'mermaid-diagram'

/** Read the language hint (for example `mermaid`) from a `<code>` element's class names. */
function getLanguage(node: Element): string {
  const list = node.properties?.className

  if (!Array.isArray(list)) {
    return ''
  }

  for (const item of list) {
    const value = String(item)

    if (value.startsWith('language-')) {
      return value.slice('language-'.length)
    }

    if (value.startsWith('lang-')) {
      return value.slice('lang-'.length)
    }
  }

  return ''
}

/**
 * Rehype plugin that turns ```mermaid fenced code blocks into client-renderable placeholders.
 *
 * A `<pre><code class="language-mermaid">…</code></pre>` becomes
 * `<pre class="mermaid-diagram">…source…</pre>`. Dropping the inner `<code>` element keeps the
 * syntax highlighter from touching it, while the source survives as plain text for the client to
 * render. Run this before the highlighter so Mermaid blocks are not highlighted as code.
 */
export function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (node.tagName !== 'code' || !parent || parent.type !== 'element' || parent.tagName !== 'pre') {
        return
      }

      if (getLanguage(node) !== 'mermaid') {
        return
      }

      const source = toText(node)

      parent.properties = { ...parent.properties, className: [MERMAID_DIAGRAM_CLASS] }
      parent.children = [{ type: 'text', value: source }]
    })
  }
}
