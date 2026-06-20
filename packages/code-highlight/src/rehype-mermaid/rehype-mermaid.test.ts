import { describe, expect, it } from 'vitest'

import { htmlFromMarkdown } from '../markdown'

describe('rehypeMermaid', () => {
  it('turns a mermaid code block into a placeholder element', () => {
    const html = htmlFromMarkdown(['```mermaid', 'graph TD;', 'A-->B;', '```'].join('\n'))

    expect(html).toContain('<pre class="mermaid-diagram">')
    // The diagram source is preserved as text for the client to render
    expect(html).toContain('graph TD;')
    // It should not be highlighted as a code block
    expect(html).not.toContain('language-mermaid')
    expect(html).not.toContain('hljs')
    expect(html).toContain('no-highlight')
  })

  it('preserves newlines in the mermaid source', () => {
    const html = htmlFromMarkdown(
      ['```mermaid', 'sequenceDiagram', 'Alice->>Bob: Hi', 'Bob-->>Alice: Yo', '```'].join('\n'),
    )

    expect(html).toContain('<pre class="mermaid-diagram">')
    // Statements stay on separate lines so Mermaid can parse them (it does not use separators here)
    expect(html).toContain('sequenceDiagram\nAlice->>Bob: Hi\nBob-->>Alice: Yo')
  })

  it('does not affect other fenced code blocks', () => {
    const html = htmlFromMarkdown(['```js', 'const a = 1', '```'].join('\n'))

    expect(html).not.toContain('mermaid-diagram')
    expect(html).toContain('hljs')
  })

  it('leaves inline code untouched', () => {
    const html = htmlFromMarkdown('Some `mermaid` inline code')

    expect(html).not.toContain('mermaid-diagram')
    expect(html).toContain('<code>mermaid</code>')
  })
})
