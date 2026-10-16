import type { ApiReferencePlugin } from '@scalar/types/api-reference'

import { renderMermaid } from './render-mermaid'

/** Enable interactive Mermaid fences in all Scalar API Reference Markdown renderings. */
export const mermaidPlugin = (): ApiReferencePlugin => () => ({
  name: '@scalar/mermaid-plugin',
  extensions: [],
  markdown: renderMermaid,
})
