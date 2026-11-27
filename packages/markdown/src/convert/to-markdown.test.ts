import type { Nodes, PhrasingContent, Root, RootContent } from 'mdast'
import { describe, expect, it } from 'vitest'

import { mdastFromHtml } from './mdast-from-html'
import { parseMarkdown } from './parse-markdown'
import { createMarkdownSerializer } from './to-markdown'

const serialize = createMarkdownSerializer()
const root = (...children: RootContent[]): Root => ({ type: 'root', children })
const paragraph = (...children: PhrasingContent[]): RootContent => ({ type: 'paragraph', children })
const text = (value: string): PhrasingContent => ({ type: 'text', value })

/** The tree without what Markdown cannot express: `spread`, and how text is split into nodes. */
const comparable = (node: Nodes): unknown => {
  const { spread: _, ...rest } = node as Nodes & { spread?: boolean }
  if (!('children' in node)) return rest
  const children: Nodes[] = []
  for (const child of node.children as Nodes[]) {
    const last = children.at(-1)
    if (child.type === 'text' && last?.type === 'text')
      children[children.length - 1] = { ...last, value: last.value + child.value }
    else children.push(child)
  }
  return { ...rest, children: children.map(comparable) }
}

describe('to-markdown', () => {
  it('uses the remark-stringify defaults', () => {
    const tree = parseMarkdown(
      '# Title\n\n_em_ __strong__ ~~del~~\n\n+ a\n+ b\n\n3. three\n3. four\n\n___\n\n~~~js\ncode\n~~~\n\n> quote',
    )

    expect(serialize(tree)).toBe(
      '# Title\n\n*em* **strong** ~~del~~\n\n* a\n* b\n\n3. three\n4. four\n\n***\n\n```js\ncode\n```\n\n> quote\n',
    )
  })

  it('uses the bullet it is given', () => {
    expect(createMarkdownSerializer({ bullet: '-' })(parseMarkdown('* one\n* two'))).toBe('- one\n- two\n')
    expect(() => createMarkdownSerializer({ bullet: 'x' as '-' })).toThrow('Cannot serialize items')
  })

  it('switches bullets where the same one would merge two lists or make a thematic break', () => {
    const list = (...items: RootContent[][]): RootContent => ({
      type: 'list',
      ordered: false,
      spread: false,
      children: items.map((children) => ({ type: 'listItem', spread: false, children: children as never })),
    })

    expect(serialize(root(list([paragraph(text('a'))]), list([paragraph(text('b'))])))).toBe('* a\n\n- b\n')
    expect(serialize(root(list([{ type: 'thematicBreak' }])))).toBe('- ***\n')
  })

  it('asks join handlers, the last one first, how far apart flow nodes go', () => {
    const tree = parseMarkdown('- a\n\n  ```\n  b\n  ```\n- c')
    const apart = createMarkdownSerializer({
      join: [(left, right) => (left.type === 'code' || right.type === 'code' ? 1 : undefined)],
    })
    const together = createMarkdownSerializer({ join: [() => 0] })

    expect(apart(tree)).toBe('* a\n\n  ```\n  b\n  ```\n* c\n')
    expect(together(tree)).toBe('* a\n  ```\n  b\n  ```\n* c\n')
  })

  it('writes tables with aligned, padded cells', () => {
    expect(serialize(parseMarkdown('| a | long header | c |\n| :-: | -: | :- |\n| 1 | 2 | 3 |'))).toBe(
      '|  a  | long header | c  |\n| :-: | ----------: | :- |\n|  1  |           2 | 3  |\n',
    )
  })

  it('escapes pipes in table cells, also inside code', () => {
    const markdown = serialize(parseMarkdown('| a |\n| - |\n| x \\| `y \\| z` |'))

    // Widths count the escapes too, as `markdown-table` does.
    expect(markdown).toBe('| a             |\n| ------------- |\n| x \\| `y \\| z` |\n')
    expect(parseMarkdown(markdown)).toStrictEqual(parseMarkdown('| a |\n| - |\n| x \\| `y \\| z` |'))
  })

  it('writes task list items and footnotes', () => {
    expect(serialize(parseMarkdown('- [x] done\n- [ ] todo\n\nText[^1].\n\n[^1]: Note\n    more'))).toBe(
      '* [x] done\n* [ ] todo\n\nText[^1].\n\n[^1]: Note\n    more\n',
    )
  })

  it('writes autolinks where the text is the URL, and resource links otherwise', () => {
    const tree = root(
      paragraph(
        { type: 'link', url: 'https://example.com', children: [text('https://example.com')] },
        text(' '),
        { type: 'link', url: 'mailto:a@b.example', children: [text('a@b.example')] },
        text(' '),
        { type: 'link', url: 'https://example.com/a b', title: 'Say "hi"', children: [text('x')] },
        text(' '),
        { type: 'link', url: 'https://example.com/(a)', children: [text('y')] },
      ),
    )

    expect(serialize(tree)).toBe(
      '<https://example.com> <a@b.example> [x](<https://example.com/a b> "Say \\"hi\\"") [y](https://example.com/\\(a\\))\n',
    )
  })

  it('picks a code fence longer than any run of backticks inside', () => {
    expect(serialize(root({ type: 'code', lang: null, meta: null, value: 'a ``` b' }))).toBe('````\na ``` b\n````\n')
    expect(serialize(root(paragraph({ type: 'inlineCode', value: 'a`b' })))).toBe('``a`b``\n')
    expect(serialize(root(paragraph({ type: 'inlineCode', value: '`' })))).toBe('`` ` ``\n')
  })

  it('encodes the characters around emphasis that would stop it from opening or closing', () => {
    const tree = root(paragraph(text('a'), { type: 'emphasis', children: [text(' b ')] }, text('c')))

    expect(serialize(tree)).toBe('&#x61;*&#x20;b&#x20;*&#x63;\n')
    expect(comparable(parseMarkdown(serialize(tree)))).toStrictEqual(comparable(tree))
  })

  it('keeps leading spaces and line breaks in headings and paragraphs', () => {
    expect(serialize(root(paragraph(text(' a'), { type: 'break' }, text('b'))))).toBe('&#x20;a\\\nb\n')
    expect(serialize(root({ type: 'heading', depth: 3, children: [text('a\nb')] }))).toBe('### a&#xA;b\n')
    // A line ending needs a setext heading, underlined as long as its last line.
    expect(serialize(root({ type: 'heading', depth: 1, children: [text('a\nb')] }))).toBe('a\nb\n=\n')
  })

  it('writes blocks that are in inline content inline, so code cannot turn into raw HTML', () => {
    const html = '&lt;img src=x onerror=alert(1)&gt;'
    const cell = serialize(
      mdastFromHtml(`<table><tr><td><pre><code>${html}\n| b</code></pre><p>c</p></td></tr></table>`),
    )
    const emphasis = serialize(mdastFromHtml(`<em><pre>${html}</pre></em>`))
    const heading = serialize(mdastFromHtml(`<h3>a<pre>${html}\nb</pre></h3>`))

    // `mdast-util-to-markdown` writes a fenced code block into the cell, which ends the table and
    // leaves the code as raw HTML.
    expect(cell).toBe(
      '|                                       |\n| ------------------------------------- |\n| `<img src=x onerror=alert(1)> \\| b` c |\n',
    )
    expect(emphasis).toBe('*`<img src=x onerror=alert(1)>`*\n')
    expect(heading).toBe('### a `<img src=x onerror=alert(1)> b`\n')
    for (const markdown of [cell, emphasis, heading]) {
      const tree = parseMarkdown(markdown)
      const html = (node: Nodes): boolean => node.type === 'html' || ('children' in node && node.children.some(html))

      expect(html(tree)).toBe(false)
    }
  })

  it('throws on nodes it does not support, instead of writing something else', () => {
    expect(() => serialize(root(paragraph({ type: 'image', url: 'x', alt: 'y' })))).toThrow(
      'Cannot handle unknown node `image`',
    )
  })

  it('never turns text into markup', () => {
    const dangerous = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<!-- comment -->',
      '[link](javascript:alert(1))',
      '![image](/x.png)',
      '<a:b>',
      '*a* _b_ **c** ~~d~~ `e`',
      '&amp; &#x3C; &lt;',
      '# heading',
      '> quote',
      '- item',
      '1. item',
      '| a |',
      '[^1]',
      '\\',
      '```',
    ]
    for (const value of dangerous) {
      for (const tree of [
        root(paragraph(text(value))),
        root(paragraph(text(`x ${value} y`))),
        root({ type: 'heading', depth: 2, children: [text(value)] }),
        root({
          type: 'table',
          align: [null],
          children: [{ type: 'tableRow', children: [{ type: 'tableCell', children: [text(value)] }] }],
        }),
        root(paragraph({ type: 'link', url: 'https://example.com', title: null, children: [text(value)] })),
      ]) {
        expect(comparable(parseMarkdown(serialize(tree)))).toStrictEqual(comparable(tree))
      }
    }
  })

  it('cannot stop a literal URL in text from becoming a link, like remark', () => {
    // mdast parsers find GFM autolink literals in decoded text, so `https\://` is a link anyway.
    // The old serializer wrote the same Markdown. The link's URL is its visible text.
    const markdown = serialize(root(paragraph(text('see <https://example.com> or www.example.com'))))

    expect(markdown).toBe('see \\<https\\://example.com> or www\\.example.com\n')
    expect(comparable(parseMarkdown(markdown).children[0]!)).toStrictEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'see <' },
        {
          type: 'link',
          url: 'https://example.com',
          title: null,
          children: [{ type: 'text', value: 'https://example.com' }],
        },
        { type: 'text', value: '> or ' },
        {
          type: 'link',
          url: 'http://www.example.com',
          title: null,
          children: [{ type: 'text', value: 'www.example.com' }],
        },
      ],
    })
  })

  it('round-trips random text made of Markdown punctuation', () => {
    // A small, deterministic version of `explorations/markdown-pipeline/bench/copy-roundtrip.mjs`.
    let seed = 7
    const random = (): number => {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
      return seed / 2_147_483_648
    }
    const pieces = [...'*_[]()<>&!#`|~\\:@.-+=^"\'{}', 'a', 'b', ' ', '1.', '&amp;', '<b>', 'http', '://', 'x.y']
    for (let i = 0; i < 2000; i++) {
      let value = ''
      while (value.length < 12) value += pieces[Math.floor(random() * pieces.length)]
      // Autolink literals are found in decoded text by every mdast parser, so no escape can stop them.
      if (/www\.|:\/\/|@/.test(value)) continue
      const tree = root(paragraph(text(value)))
      expect(comparable(parseMarkdown(serialize(tree)))).toStrictEqual(comparable(tree))
    }
  })

  it('stays linear on long runs of unsafe characters', () => {
    const value = '*'.repeat(200_000)
    const started = performance.now()

    expect(serialize(root(paragraph(text(value))))).toBe(`${'\\*'.repeat(200_000)}\n`)
    expect(performance.now() - started).toBeLessThan(2000)
  })
})
