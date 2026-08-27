import { describe, expect, it } from 'vitest'

import MermaidDiagram from './MermaidDiagram.vue'
import { MERMAID_EXTENSION_NAME, createMermaidPlugin } from './plugin'

describe('createMermaidPlugin', () => {
  it('registers a single x-mermaid extension', () => {
    const plugin = createMermaidPlugin()()

    expect(plugin.name).toBe('mermaid')
    expect(plugin.extensions).toEqual([{ name: MERMAID_EXTENSION_NAME, component: MermaidDiagram }])
  })

  it('uses the x-mermaid extension name', () => {
    expect(MERMAID_EXTENSION_NAME).toBe('x-mermaid')
  })
})
