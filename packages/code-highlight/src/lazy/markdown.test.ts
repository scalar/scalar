import { describe, expect, it } from 'vitest'

import { htmlFromMarkdown } from '../markdown/html-from-markdown'
import { renderMarkdown } from '../markdown/markdown'
import { highlightMarkdown } from './markdown'

describe('markdown', () => {
  it.each([
    '# Heading\n\nText **bold**.',
    '```python\nprint("hello")\n```',
    '```\nconst answer = 42\n```',
    '<pre><code class="language-json">{"answer":42}</code></pre>',
    '<script>alert(1)</script>\n\n```html\n<script>alert(1)</script>\n```',
  ])('preserves sanitized Markdown and code rendering for %s', async (markdown) => {
    expect(await highlightMarkdown(renderMarkdown(markdown))).toBe(htmlFromMarkdown(markdown))
  })

  it('keeps sanitization synchronous before any grammars load', () => {
    expect(renderMarkdown('<script>alert(1)</script>Safe')).toBe('Safe')
  })
})
