import { describe, expect, it } from 'vitest'

import { htmlFromMarkdown } from '../markdown'

describe('rehypeMermaid', () => {
  it('turns a mermaid code block into a placeholder element', () => {
    const html = htmlFromMarkdown(['```mermaid', 'graph TD;', 'A-->B;', '```'].join('\n'))

    expect(html).toContain('<pre class="mermaid-diagram">')
    // The diagram source is preserved as plain text for the client to render
    expect(html).toContain('graph TD;')
    // It should not be highlighted as a code block
    expect(html).not.toContain('language-mermaid')
    expect(html).not.toContain('hljs')
  })

  it('keeps the raw mermaid source without wrapping it in a code element', () => {
    const html = htmlFromMarkdown(['```mermaid', 'sequenceDiagram', 'Alice->>Bob: Hi', '```'].join('\n'))

    expect(html).toContain('<pre class="mermaid-diagram">')
    expect(html).toContain('sequenceDiagram')
    expect(html).not.toContain('<code')
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
