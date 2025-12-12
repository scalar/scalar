import { describe, expect, it } from 'vitest'

import { htmlFromMarkdown } from './markdown'

describe('htmlFromMarkdown', () => {
  it('returns HTML', () => {
    const html = htmlFromMarkdown('# Example Heading')

    expect(html.trim()).toEqual('<h1>Example Heading</h1>')
  })

  it('removes tags', () => {
    const html = htmlFromMarkdown('# <i>Example</i> <em>Heading</em>', {
      removeTags: ['i'],
    })

    expect(html.trim()).toEqual('<h1>Example <em>Heading</em></h1>')
  })

  it('removes script tags', () => {
    const html = htmlFromMarkdown(`# Example Heading<script>alert('foobar');</script>`)

    expect(html.trim()).toEqual('<h1>Example Heading</h1>')
  })

  it('allows given tags', () => {
    const html = htmlFromMarkdown(`# Example Heading<script>alert('foobar');</script>`, {
      allowTags: ['script'],
    })

    expect(html.trim()).toEqual(`<h1>Example Heading\n  <script>alert('foobar');</script>\n</h1>`)
  })

  it('allows to add ids', () => {
    const html = htmlFromMarkdown('# Example Heading', {
      transformType: 'heading',
      transform: (node) => {
        node.data = {
          hProperties: {
            id: 'example-heading',
          },
        }

        return node
      },
    })

    expect(html.trim()).toEqual('<h1 id="example-heading">Example Heading</h1>')
  })

  // HTML Sanitization Tests
  it('removes iframe tags to prevent embedding attacks', () => {
    const html = htmlFromMarkdown('<iframe src="https://malicious-site.com"></iframe>Some content')

    expect(html.trim()).not.toContain('<iframe')
    expect(html.trim()).not.toContain('malicious-site')
    expect(html.trim()).toContain('Some content')
  })

  it('removes dangerous HTML elements like object, embed, and form', () => {
    const html = htmlFromMarkdown(`
<object data="malicious.swf"></object>
<embed src="malicious.swf">
<form action="https://evil.com"><button type="submit">Submit</button></form>
<style>body { display: none; }</style>
Safe paragraph
`)

    expect(html.trim()).not.toContain('<object')
    expect(html.trim()).not.toContain('<embed')
    expect(html.trim()).not.toContain('<form')
    expect(html.trim()).not.toContain('<style')
    expect(html.trim()).not.toContain('display: none')
    expect(html.trim()).toContain('Safe paragraph')
  })

  // JavaScript Sanitization Tests
  it('removes onclick and other event handler attributes', () => {
    const html = htmlFromMarkdown(`
<div onclick="alert('xss')">Click me</div>
<button onmouseover="stealCookies()">Hover</button>
<img src="x" onerror="alert('xss')">
`)

    expect(html.trim()).not.toContain('onclick')
    expect(html.trim()).not.toContain('onmouseover')
    expect(html.trim()).not.toContain('onerror')
    expect(html.trim()).not.toContain('alert(')
    expect(html.trim()).not.toContain('stealCookies')
  })

  it('removes javascript: protocol URLs from links', () => {
    const html = htmlFromMarkdown(`
[Click me](javascript:alert('xss'))
<a href="javascript:document.cookie">Steal cookies</a>
[Safe link](https://example.com)
`)

    expect(html.trim()).not.toContain('javascript:')
    expect(html.trim()).toContain('https://example.com')
  })

  // Critical Feature Tests
  it('renders GFM tables correctly', () => {
    const html = htmlFromMarkdown(`
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`)

    expect(html.trim()).toContain('<table>')
    expect(html.trim()).toContain('<th>Header 1</th>')
    expect(html.trim()).toContain('<td>Cell 1</td>')
  })

  it('renders GFM strikethrough and task lists', () => {
    const html = htmlFromMarkdown(`
~~deleted text~~

- [ ] unchecked
- [x] checked
`)

    expect(html.trim()).toContain('<del>deleted text</del>')
    expect(html.trim()).toContain('type="checkbox"')
  })

  it('adds target="_blank" to external links', () => {
    const html = htmlFromMarkdown('[External](https://example.com)')

    expect(html.trim()).toContain('target="_blank"')
    expect(html.trim()).toContain('href="https://example.com"')
  })

  it('applies syntax highlighting to fenced code blocks', () => {
    const html = htmlFromMarkdown(`
\`\`\`javascript
const x = 42;
\`\`\`
`)

    expect(html.trim()).toContain('<code')
    expect(html.trim()).toContain('hljs')
  })

  it('preserves class attributes on elements', () => {
    const html = htmlFromMarkdown('<div class="custom-class">Content</div>')

    expect(html.trim()).toContain('class="custom-class"')
    expect(html.trim()).toContain('Content')
  })

  it('handles deeply nested markdown without breaking', () => {
    const html = htmlFromMarkdown(`
> > > Triple nested blockquote
>
> - Nested list in blockquote
>   - Even deeper
>     - **Bold** and *italic* text
`)

    expect(html.trim()).toContain('<blockquote>')
    expect(html.trim()).toContain('<strong>Bold</strong>')
    expect(html.trim()).toContain('<em>italic</em>')
  })
})
