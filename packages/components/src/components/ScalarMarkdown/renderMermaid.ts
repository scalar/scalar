/**
 * Client-side rendering of Mermaid diagrams.
 *
 * The markdown pipeline turns ```mermaid fenced code blocks into
 * `<pre class="mermaid-diagram">…source…</pre>` placeholders (see `@scalar/code-highlight`'s
 * `rehypeMermaid`). Mermaid itself needs a browser to measure text and lay out the SVG, so the
 * actual rendering happens here, after the HTML is in the DOM.
 *
 * Mermaid is a large dependency, so it is loaded lazily with a dynamic import. Documents without a
 * diagram never download it.
 */

/** Class name shared with `@scalar/code-highlight`'s `rehypeMermaid` placeholder. */
const MERMAID_DIAGRAM_CLASS = 'mermaid-diagram'

/** Attribute used to stash the original source so diagrams can be re-rendered (e.g. on theme change). */
const SOURCE_ATTRIBUTE = 'data-mermaid-source'

/** Attribute reflecting the render state, useful for styling and tests. */
const STATE_ATTRIBUTE = 'data-mermaid-state'

/** Cached promise for the lazily imported Mermaid module. */
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

/** Monotonic counter for unique diagram ids (Mermaid requires a unique id per render). */
let diagramId = 0

/** Lazily import Mermaid, reusing the same promise across calls. */
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((module) => module.default)
  }

  return mermaidPromise
}

/**
 * Find Mermaid placeholders inside the container and render them into SVG.
 *
 * Safe to call repeatedly: the original source is preserved on the element so re-rendering (for
 * example after a theme change) always works from the source, not the previously rendered SVG.
 */
export const renderMermaidDiagrams = async (
  container: HTMLElement | null | undefined,
  options?: { isDark?: boolean },
): Promise<void> => {
  if (!container || typeof window === 'undefined') {
    return
  }

  const elements = Array.from(container.querySelectorAll<HTMLElement>(`pre.${MERMAID_DIAGRAM_CLASS}`))

  if (elements.length === 0) {
    return
  }

  const mermaid = await loadMermaid()

  mermaid.initialize({
    startOnLoad: false,
    // Avoid rendering arbitrary HTML or running click handlers from untrusted diagram sources.
    securityLevel: 'strict',
    theme: options?.isDark ? 'dark' : 'default',
  })

  await Promise.all(
    elements.map(async (element) => {
      // Read from the stashed source first so re-renders do not consume the rendered SVG.
      const source = element.getAttribute(SOURCE_ATTRIBUTE) ?? element.textContent ?? ''

      if (!source.trim()) {
        return
      }

      // Stash the source once so future re-renders have it.
      element.setAttribute(SOURCE_ATTRIBUTE, source)

      const id = `scalar-mermaid-${(diagramId += 1)}`

      try {
        const { svg, bindFunctions } = await mermaid.render(id, source)
        element.innerHTML = svg
        bindFunctions?.(element)
        element.setAttribute(STATE_ATTRIBUTE, 'rendered')
      } catch (error) {
        // Leave the source text visible so authors can spot invalid diagrams.
        element.setAttribute(STATE_ATTRIBUTE, 'error')
        console.error('[ScalarMarkdown] Failed to render Mermaid diagram:', error)
      }
    }),
  )
}
