import { describe, expect, it } from 'vitest'

import { type Node, htmlFromMarkdown } from './pipeline'

const fence = (lang: string, code = 'const x = 1'): string => `\`\`\`${lang}\n${code}\n\`\`\``

describe('pipeline', () => {
  describe('code blocks', () => {
    const highlight = (code: string, lang: string): string | null =>
      lang === 'js' ? `<span class="hljs-keyword">${code.trimEnd()}</span>\n` : null

    it('keeps only the language class without a highlighter', () => {
      expect(htmlFromMarkdown(fence('js'))).toBe('<pre><code class="language-js">const x = 1\n</code></pre>')
    })

    it('writes the highlighted markup with the hljs classes', () => {
      expect(htmlFromMarkdown(fence('js'), { highlight, codeClassName: 'custom-scroll' })).toBe(
        '<pre><code class="hljs language-js custom-scroll"><span class="hljs-keyword">const x = 1</span>\n</code></pre>',
      )
    })

    it('escapes a block whose language has no grammar', () => {
      expect(htmlFromMarkdown(fence('nope', 'a < b'), { highlight })).toBe(
        '<pre><code class="hljs language-nope">a &lt; b\n</code></pre>',
      )
    })

    it('does not ask the highlighter about an unlabelled block', () => {
      const calls: string[] = []
      const html = htmlFromMarkdown(fence(''), {
        highlight: (_code, lang) => {
          calls.push(lang)
          return null
        },
      })

      expect(calls).toEqual([])
      expect(html).toBe('<pre><code class="hljs">const x = 1\n</code></pre>')
    })

    it('leaves no-highlight blocks alone', () => {
      expect(htmlFromMarkdown(fence('no-highlight'), { highlight })).toBe(
        '<pre><code class="language-no-highlight">const x = 1\n</code></pre>',
      )
    })

    it('falls back to plain text when the highlighter throws', () => {
      const html = htmlFromMarkdown(fence('js'), {
        highlight: () => {
          throw new Error('broken grammar')
        },
      })

      expect(html).toBe('<pre><code class="hljs language-js">const x = 1\n</code></pre>')
    })

    it('gives raw HTML code blocks the hljs classes', () => {
      expect(htmlFromMarkdown('<pre><code>a < b</code></pre>', { highlight, codeClassName: 'custom-scroll' })).toBe(
        '<pre><code class="hljs custom-scroll">a &lt; b</code></pre>',
      )
    })

    it('highlights raw HTML code blocks with a language class', () => {
      expect(htmlFromMarkdown('<pre><code class="language-js">x &amp;&amp; <b>y</b></code></pre>', { highlight })).toBe(
        '<pre><code class="hljs language-js"><span class="hljs-keyword">x && y</span>\n</code></pre>',
      )
    })

    it('gives code spans inside a raw pre the hljs classes', () => {
      // Inline, as in GoDaddy's descriptions: a `<pre>` starting a line is an HTML block, with no Markdown inside.
      expect(htmlFromMarkdown('Price <pre>`a` = `b`</pre>', { highlight, codeClassName: 'custom-scroll' })).toBe(
        '<p>Price </p><pre><code class="hljs custom-scroll">a</code> = <code class="hljs custom-scroll">b</code></pre><p></p>',
      )
    })

    it('leaves raw code outside a pre alone', () => {
      expect(htmlFromMarkdown('<p><code class="language-js">x</code></p>', { highlight })).toBe(
        '<p><code class="language-js">x</code></p>',
      )
    })

    it('leaves raw no-highlight code blocks alone', () => {
      expect(htmlFromMarkdown('<pre><code class="language-no-highlight">x</code></pre>', { highlight })).toBe(
        '<pre><code class="language-no-highlight">x</code></pre>',
      )
    })

    it('escapes the language in the class attribute', () => {
      expect(htmlFromMarkdown(fence('"><script>'), { highlight })).not.toContain('<script>')
    })
  })

  describe('transform data', () => {
    /** Sets `data` on every node of `type`, as `transform` callbacks written for remark do. */
    const withData = (type: string, data: Node['data']) => ({
      transformType: type,
      transform: (node: Node) => {
        node.data = data
        return node
      },
    })

    it('renames an element with hName and adds its hProperties', () => {
      expect(
        htmlFromMarkdown('> quote', withData('blockquote', { hName: 'div', hProperties: { className: ['marker'] } })),
      ).toBe('<div class="marker">\n<p>quote</p>\n</div>')
    })

    it('gives a heading an id', () => {
      expect(htmlFromMarkdown('# Title', withData('heading', { hProperties: { id: 'a&copy' } }))).toBe(
        '<h1 id="a&amp;copy">Title</h1>',
      )
    })

    it('maps camel-cased aria properties to their attributes', () => {
      const html = htmlFromMarkdown('| a |\n| - |\n| b |', withData('table', { hProperties: { ariaLabel: 'x' } }))

      expect(html.startsWith('<table aria-label="x">')).toBe(true)
    })

    it('keeps only the attributes the schema allows on the tag', () => {
      expect(htmlFromMarkdown('text', withData('paragraph', { hProperties: { ariaLabel: 'x', title: 'y' } }))).toBe(
        '<p title="y">text</p>',
      )
    })

    it('drops properties and tags the allowlist does not allow', () => {
      const html = htmlFromMarkdown(
        'text',
        withData('paragraph', { hName: 'script', hProperties: { onclick: 'alert(1)', style: 'color: red' } }),
      )

      expect(html).toBe('text')
    })

    it('escapes property values', () => {
      expect(htmlFromMarkdown('text', withData('paragraph', { hProperties: { title: '"><script>' } }))).toBe(
        '<p title="&quot;>&lt;script>">text</p>',
      )
    })
  })

  describe('headings', () => {
    it.each([
      ['# foo #', 'foo'],
      ['# foo ###   ', 'foo'],
      ['# foo#', 'foo#'],
      ['# foo \\#', 'foo #'],
      ['# ###', ''],
      ['# #', ''],
      ['#\t#\t', ''],
      ['# foo # bar', 'foo # bar'],
      ['# foo\t#', 'foo'],
    ])('strips the closing sequence of %j', (markdown, text) => {
      expect(htmlFromMarkdown(markdown)).toBe(`<h1>${text}</h1>`)
    })

    it('takes linear time on a long run of tabs', () => {
      const tabs = '\t'.repeat(100_000)
      const start = performance.now()
      htmlFromMarkdown(`# a${tabs}b`)
      htmlFromMarkdown(`# a${tabs}`)

      // Quadratic backtracking took about 20 seconds here.
      expect(performance.now() - start).toBeLessThan(2000)
    })
  })

  describe('tables', () => {
    it('recognizes a delimiter row with a trailing pipe and spaces', () => {
      expect(htmlFromMarkdown('| a |\n| - |  \n| b |')).toContain('<td>b</td>')
    })

    it('takes linear time on a long run of tabs after a dash', () => {
      const start = performance.now()
      htmlFromMarkdown(`a\n-${'\t'.repeat(100_000)}x`)

      expect(performance.now() - start).toBeLessThan(2000)
    })
  })

  describe('raw HTML comments', () => {
    it('ends a comment at --!>, as the browser does', () => {
      expect(htmlFromMarkdown('<!-- a --!> visible')).toBe(' visible')
    })

    it('still drops the comment itself', () => {
      expect(htmlFromMarkdown('<p>a<!-- <img src=x onerror=alert(1)> --!>b</p>', { removeTags: [] })).toBe('<p>ab</p>')
    })
  })

  describe('email autolink literals', () => {
    it.each([
      ['a@x.com', '<p><a href="mailto:a@x.com">a@x.com</a></p>'],
      ['a@x.com.org', '<p><a href="mailto:a@x.com.org">a@x.com.org</a></p>'],
      ['a.b-c+d@x.co', '<p><a href="mailto:a.b-c+d@x.co">a.b-c+d@x.co</a></p>'],
      ['/a@x.com', '<p>/a@x.com</p>'],
      ['a@x.com1', '<p>a@x.com1</p>'],
      ['a@b@x.com', '<p>a@<a href="mailto:b@x.com">b@x.com</a></p>'],
    ])('links %j as GFM does', (markdown, html) => {
      expect(htmlFromMarkdown(markdown)).toBe(html)
    })

    it('takes linear time on a long local part with no domain', () => {
      const start = performance.now()
      htmlFromMarkdown(`a@${'_'.repeat(100_000)}`)
      htmlFromMarkdown(`x ${'a.'.repeat(50_000)}@b`)

      // The regular expression this replaced took about 25 seconds here.
      expect(performance.now() - start).toBeLessThan(2000)
    })
  })

  describe('containment', () => {
    /**
     * The end tags the output contains, minus the start tags, by name. A server-rendered page
     * concatenates the output into its own HTML, so an end tag without a start tag of its own
     * would close one of the page's elements.
     */
    const unmatchedEndTags = (html: string): string[] => {
      const open: string[] = []
      const stray: string[] = []
      for (const [, end, name] of html.matchAll(/<(\/?)([a-z][a-z0-9]*)[^>]*>/g)) {
        if (!end) {
          if (!['br', 'hr', 'img', 'input', 'source', 'wbr'].includes(name!)) open.push(name!)
        } else if (open.at(-1) === name) open.pop()
        else stray.push(name!)
      }
      return stray
    }

    it.each([
      ['a table start tag inside a table', '<table><div><div><table></table></div></div></table>\n\n<div>after</div>'],
      ['a ruby text inside a list item', '<ul><li><div><ruby><li><rt>x</rt></li></ruby></div></li></ul>\n\nafter'],
      ['a heading inside a heading', '<h1><h2>x</h2></h1>\n\nafter'],
      ['a table part after a foster-parented element', '<table><div><tr><td>x</td></tr></table>'],
      [
        'a Markdown list item after raw HTML closed its list',
        '- a\n  <li><div><marquee>\n- b\n\n</marquee></div>\n\nafter',
      ],
    ])('leaves no end tag for the page for %s', (_name, markdown) => {
      expect(unmatchedEndTags(htmlFromMarkdown(markdown))).toEqual([])
    })

    it('closes the table and what is open in it when another table starts', () => {
      expect(htmlFromMarkdown('<table><div><table></table></div></table>')).toBe(
        '<table><div></div></table><table></table>',
      )
    })

    it('drops a list item outside any list, whose start tag would close a list item around the output', () => {
      expect(htmlFromMarkdown('<li>a<li>b')).toBe('ab')
      expect(htmlFromMarkdown('<div><dd>x</dd></div>')).toBe('<div>x</div>')
      expect(htmlFromMarkdown('<ul><li>a<li>b</ul>')).toBe('<ul><li>a</li><li>b</li></ul>')
    })
  })

  describe('limits', () => {
    it('reopens at most three identical formatting elements', () => {
      expect(htmlFromMarkdown('<p><b><b><b><b><b><p>x')).toBe(
        '<p><b><b><b><b><b></b></b></b></b></b></p><p><b><b><b>x</b></b></b></p>',
      )
    })

    it('drops raw start tags past 512 open elements', () => {
      const html = htmlFromMarkdown('<span>'.repeat(1000))

      expect(html.match(/<span>/g)?.length).toBeLessThanOrEqual(512)
    })

    it('stops padding table rows past the budget', () => {
      const width = 1000
      const markdown = `|${'a|'.repeat(width)}\n|${'-|'.repeat(width)}\n${'x\n'.repeat(1000)}`

      expect(htmlFromMarkdown(markdown).length).toBeLessThan(2_000_000)
    })

    it('stops expanding references past the budget', () => {
      const markdown = `[a]: /${'x'.repeat(10_000)}\n\n${'[a] '.repeat(1000)}`

      expect(htmlFromMarkdown(markdown).length).toBeLessThan(400_000)
    })

    it.each([
      ['a URL with long trailing punctuation', `http://a.b/${'.'.repeat(100_000)}a`],
      ['www. followed by underscores', 'www._'.repeat(20_000)],
      ['footnote openers', `${'[^'.repeat(30_000)}${']'.repeat(30_000)}`],
      ['image footnote calls', '![^'.repeat(30_000)],
      ['unclosed instructions', `a${' <?'.repeat(30_000)}`],
      ['unclosed CDATA sections', `a${' <![CDATA['.repeat(10_000)}`],
      ['comments in raw HTML', `<div>\n${'<!--a-->'.repeat(10_000)}`],
      ['delimiter-like lines in a paragraph', 'x\n|-|-\n'.repeat(10_000)],
      ['deep raw HTML', '<div>'.repeat(100_000)],
    ])('takes linear time on %s', (_name, markdown) => {
      const start = performance.now()
      htmlFromMarkdown(markdown)

      expect(performance.now() - start).toBeLessThan(2000)
    })
  })

  describe('attributes', () => {
    it('checks srcset candidates after decoding, as the browser splits them', () => {
      const options = { removeTags: [] }

      expect(
        htmlFromMarkdown('<picture><source srcset="https://a 1x&#44;data:image/svg+xml,x 2x"></picture>', options),
      ).not.toContain('srcset')
      expect(
        htmlFromMarkdown('<picture><source srcset="https://a/x.png 1x, https://a/y,z.png 2x"></picture>', options),
      ).toContain('srcset="https://a/x.png 1x, https://a/y,z.png 2x"')
    })

    it('drops name on images, which would clobber document properties', () => {
      expect(htmlFromMarkdown('<img name="getElementById" src="https://a/x.png">', { removeTags: [] })).toBe(
        '<img src="https://a/x.png">',
      )
    })
  })
})
