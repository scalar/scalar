import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Class name applied to the placeholder element that holds a Mermaid diagram source.
 *
 * The actual diagram is rendered on the client (Mermaid needs a browser to measure text and lay
 * out the SVG), so this plugin only marks a stable placeholder that keeps the source as text.
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
 * Rehype plugin that marks ```mermaid fenced code blocks for client-side rendering.
 *
 * A `<pre><code class="language-mermaid">…</code></pre>` becomes
 * `<pre class="mermaid-diagram"><code class="no-highlight">…source…</code></pre>`. The `no-highlight`
 * class keeps the syntax highlighter off it, and keeping the `<code>` wrapper preserves the source
 * verbatim (including newlines) through `rehype-format`, which collapses whitespace in a bare
 * `<pre>`. The client reads the element's text content and swaps in the rendered SVG.
 *
 * Run this before the highlighter so Mermaid blocks are not highlighted as code.
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

      // Mark the wrapper so the client can find and render the diagram.
      parent.properties = { ...parent.properties, className: [MERMAID_DIAGRAM_CLASS] }
      // Opt the code out of syntax highlighting while keeping the source text (and its newlines).
      node.properties = { ...node.properties, className: ['no-highlight'] }
    })
  }
}
