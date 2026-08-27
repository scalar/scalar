import type { ApiReferencePlugin } from '@scalar/types/api-reference'

import MermaidDiagram from './MermaidDiagram.vue'

/** The specification extension name this plugin renders. Works on any object — `info`, a tag, an operation, an Arazzo workflow or step, … — wherever the surrounding UI passes its extensions through `SpecificationExtension`. */
export const MERMAID_EXTENSION_NAME = 'x-mermaid'

/**
 * Renders `x-mermaid` specification extensions as Mermaid diagrams.
 *
 * Registers a single specification-extension component; nothing about this plugin runs, and
 * `mermaid` is never fetched, unless a loaded document actually carries an `x-mermaid` value and
 * the surrounding UI mounts this component for it.
 *
 * @example
 * ```ts
 * import { createMermaidPlugin } from '@scalar/plugin-mermaid'
 *
 * createApiReference('#app', {
 *   url: '/openapi.json',
 *   plugins: [createMermaidPlugin()],
 * })
 * ```
 *
 * ```yaml
 * paths:
 *   /orders:
 *     post:
 *       x-mermaid: |
 *         sequenceDiagram
 *           Client->>API: POST /orders
 *           API->>Client: 201 Created
 * ```
 */
export const createMermaidPlugin = (): ApiReferencePlugin => {
  return () => ({
    name: 'mermaid',
    extensions: [{ name: MERMAID_EXTENSION_NAME, component: MermaidDiagram }],
  })
}
