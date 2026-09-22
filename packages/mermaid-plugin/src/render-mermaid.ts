import type { MarkdownRenderHook } from '@scalar/helpers/markdown/markdown-render-hook'

import { createDiagram } from './create-diagram'

/** Avoid loading Mermaid until an explicitly enabled plugin encounters a Mermaid fence. */
let renderer: Promise<typeof import('mermaid')['default']> | undefined
let diagramCount = 0

const loadRenderer = (): Promise<typeof import('mermaid')['default']> => {
  renderer ??= import('mermaid')
    .then(({ default: mermaid }) => {
      // API descriptions are untrusted. Strict mode sanitizes generated SVG and disables
      // callbacks; this output is inserted after Scalar’s Markdown sanitizer has run.
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true })
      return mermaid
    })
    .catch((error: unknown) => {
      renderer = undefined
      throw error
    })
  return renderer
}

/** Enhance fenced Mermaid blocks, leaving readable source in place on failure. */
export const renderMermaid: MarkdownRenderHook = async ({ element, signal }) => {
  const blocks = Array.from(element.querySelectorAll<HTMLElement>('pre > code.language-mermaid'))
  if (!blocks.length || signal.aborted) return
  const mermaid = await loadRenderer()
  if (signal.aborted) return
  const cleanups: (() => void)[] = []
  // Register immediately: cancellation can happen while a later diagram is rendering.
  const cleanup = (): void => {
    for (const dispose of cleanups.splice(0).reverse()) dispose()
  }
  signal.addEventListener('abort', cleanup, { once: true })
  for (const block of blocks) {
    if (signal.aborted) break
    const pre = block.parentElement
    if (!pre || !element.contains(pre)) continue
    try {
      const { svg } = await mermaid.render(`scalar-mermaid-${++diagramCount}`, block.textContent ?? '')
      if (signal.aborted || !element.contains(pre)) continue
      const diagram = createDiagram(svg, pre, signal)
      pre.replaceWith(diagram.element)
      cleanups.push(diagram.destroy)
    } catch (error) {
      if (!signal.aborted) console.error('Could not render Mermaid diagram:', error)
    }
  }
  return () => {
    signal.removeEventListener('abort', cleanup)
    cleanup()
  }
}
