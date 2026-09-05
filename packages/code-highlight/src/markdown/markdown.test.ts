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

  it('returns the same HTML when the same string is rendered twice', () => {
    const markdown = 'The `id` of the **customer** this charge is for, if one exists.'

    const first = htmlFromMarkdown(markdown, { removeTags: ['img', 'picture'] })
    const second = htmlFromMarkdown(markdown, { removeTags: ['img', 'picture'] })

    expect(second).toEqual(first)
    expect(first).toEqual(
      '\n<p>The <code>id</code> of the <strong>customer</strong> this charge is for, if one exists.</p>\n',
    )
  })

  it('keeps the output stable across mixed option sets', () => {
    const removeImages = { removeTags: ['img', 'picture'] }
    const images = '<img src="x.png" alt="x"> and <picture><img src="y.png"></picture>'

    // Two different strings under the same options
    expect(htmlFromMarkdown('Property number 12', removeImages)).toEqual('\n<p>Property number 12</p>\n')
    expect(htmlFromMarkdown('A model.', removeImages)).toEqual('\n<p>A model.</p>\n')

    // Then variants of allowTags and removeTags, interleaved with the first set
    expect(htmlFromMarkdown(`# Example Heading<script>alert('foobar');</script>`, { allowTags: ['script'] })).toEqual(
      `\n<h1>Example Heading\n  <script>alert('foobar');</script>\n</h1>\n`,
    )
    expect(htmlFromMarkdown('# <i>Example</i> <em>Heading</em>', { removeTags: ['i'] })).toEqual(
      '\n<h1>Example <em>Heading</em></h1>\n',
    )
    expect(htmlFromMarkdown(images, removeImages)).toEqual('\n<p>and</p>\n')
    expect(htmlFromMarkdown(images, { removeTags: [] })).toEqual(
      '\n<p>\n  <img src="x.png" alt="x"> and \n  <picture>\n    <img src="y.png">\n  </picture>\n</p>\n',
    )
    expect(htmlFromMarkdown(images)).toEqual(
      '\n<p>\n  <img src="x.png" alt="x"> and \n  <picture>\n    <img src="y.png">\n  </picture>\n</p>\n',
    )

    // And the first set again, unchanged
    expect(htmlFromMarkdown('Property number 12', removeImages)).toEqual('\n<p>Property number 12</p>\n')
    expect(htmlFromMarkdown(`# Example Heading<script>alert('foobar');</script>`, removeImages)).toEqual(
      '\n<h1>Example Heading</h1>\n',
    )
  })

  it('highlights fenced code blocks the same way on repeated calls', () => {
    const markdown = '```sh\ncurl "https://api.tailscale.com/api/v2/tailnet/-/devices"\n```'

    const first = htmlFromMarkdown(markdown)
    const second = htmlFromMarkdown(markdown)

    expect(second).toEqual(first)
    expect(first).toContain('class="hljs language-sh custom-scroll"')
    expect(first).toContain('<span class="hljs-string">')
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

  it('adds custom scroll class to highlighted code blocks', () => {
    const html = htmlFromMarkdown(`
\`\`\`sh
curl "https://api.tailscale.com/api/v2/tailnet/-/devices"
\`\`\`
`)

    expect(html.trim()).toContain('class="hljs language-sh custom-scroll"')
  })

  it('preserves class attributes on elements', () => {
    const html = htmlFromMarkdown('<div class="custom-class">Content</div>')

    expect(html.trim()).toContain('class="custom-class"')
    expect(html.trim()).toContain('Content')
  })

  it('parses inline markdown inside HTML paragraphs', () => {
    const html = htmlFromMarkdown('<p>`Foobar`</p>')

    expect(html.trim()).toBe('<p><code>Foobar</code></p>')
  })

  it('preserves literal angle-bracket text while parsing inline markdown inside HTML paragraphs', () => {
    const html = htmlFromMarkdown('<p>Use &lt;span&gt; with `className`</p>')

    expect(html.trim()).toBe('<p>Use &#x3C;span> with <code>className</code></p>')
  })

  it('does not parse markdown inside unsupported HTML tags', () => {
    const html = htmlFromMarkdown('<div>`Foobar`</div>')

    expect(html.trim()).toBe('<div>`Foobar`</div>')
  })

  it('preserves escaped inline markdown markers in normal markdown paragraphs', () => {
    const html = htmlFromMarkdown(String.raw`\*not italic\* \`not code\` \~\~not strike\~\~ \[not link\]`)

    expect(html.trim()).toBe('<p>*not italic* `not code` ~~not strike~~ [not link]</p>')
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

  /**
   * The plain-paragraph fast path skips the pipeline entirely, so every one of
   * these has to come back exactly as the pipeline would have rendered it.
   * Passing a `transform` callback forces the pipeline, which gives a reference
   * output without duplicating the expected HTML in the test.
   */
  const throughPipeline = (markdown: string): string => htmlFromMarkdown(markdown, { transform: (node) => node })

  describe('plain paragraphs', () => {
    // Every TYPE_DESCRIPTIONS value from the API reference, plus other plain shapes seen in real documents
    const plain = [
      'Integer numbers.',
      'Signed 32-bit integers (commonly used integer type).',
      'Signed 64-bit integers (long type).',
      'full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21',
      'the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z',
      'a hint to UIs to mask the input',
      'base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==',
      'binary data, used to describe files',
      'Property number 1',
      'A model.',
      '1.5 mg',
      '50% off $5',
      'c++',
      'a/b/c',
      'ISO 8601',
      'v1.2.3',
      'Preis in Euro, zum Beispiel 12,50 (café)',
    ]

    it.each(plain)('renders %j exactly as the pipeline does', (markdown) => {
      expect(htmlFromMarkdown(markdown)).toBe(throughPipeline(markdown))
    })

    it('wraps plain text in a paragraph', () => {
      expect(htmlFromMarkdown('Integer numbers.')).toBe('\n<p>Integer numbers.</p>\n')
    })

    it('still removes the paragraph when p is a removed tag', () => {
      expect(htmlFromMarkdown('Integer numbers.', { removeTags: ['p'] })).toBe(
        htmlFromMarkdown('Integer numbers.', { removeTags: ['p'], transform: (node) => node }),
      )
    })

    // Shapes the fast path has to hand back to the pipeline
    const notPlain = [
      '#x',
      'a > b',
      'a_b_c',
      'a|b',
      'www.x',
      'WWW.X',
      'a  b',
      ' a',
      'a\\',
      '1. a',
      '- a',
      'a\nb',
      '',
      'a & b',
      'trail ',
      'x@y.com',
      'mailto:x@y.com',
      'https://example.com/x',
      // A non-breaking space is whitespace to the formatter, so it stays on the pipeline
      'a\u00a0b',
    ]

    it.each(notPlain)('renders %j through the pipeline', (markdown) => {
      expect(htmlFromMarkdown(markdown)).toBe(throughPipeline(markdown))
    })
  })
})
