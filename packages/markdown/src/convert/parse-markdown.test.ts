import { describe, expect, it } from 'vitest'

import { parseMarkdown } from './parse-markdown'

describe('parse-markdown', () => {
  it('builds mdast without positions', () => {
    expect(parseMarkdown('# Title\n\nSome *text*.')).toStrictEqual({
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Title' }] },
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Some ' },
            { type: 'emphasis', children: [{ type: 'text', value: 'text' }] },
            { type: 'text', value: '.' },
          ],
        },
      ],
    })
  })

  it('parses GitHub Flavored Markdown', () => {
    const tree = parseMarkdown('| a | b |\n| :- | -: |\n| 1 |\n\n~~gone~~\n\n- [x] done')

    expect(tree.children[0]).toStrictEqual({
      type: 'table',
      align: ['left', 'right'],
      children: [
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', children: [{ type: 'text', value: 'a' }] },
            { type: 'tableCell', children: [{ type: 'text', value: 'b' }] },
          ],
        },
        // GFM fills a short row with empty cells.
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', children: [{ type: 'text', value: '1' }] },
            { type: 'tableCell', children: [] },
          ],
        },
      ],
    })
    expect(tree.children[1]).toStrictEqual({
      type: 'paragraph',
      children: [{ type: 'delete', children: [{ type: 'text', value: 'gone' }] }],
    })
    expect(tree.children[2]).toMatchObject({ type: 'list', children: [{ type: 'listItem', checked: true }] })
  })

  it('resolves reference links into inline links', () => {
    expect(parseMarkdown('[docs][d] and [d]\n\n[d]: https://example.com "Title"').children).toStrictEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'link', url: 'https://example.com', title: 'Title', children: [{ type: 'text', value: 'docs' }] },
          { type: 'text', value: ' and ' },
          { type: 'link', url: 'https://example.com', title: 'Title', children: [{ type: 'text', value: 'd' }] },
        ],
      },
    ])
  })

  it('keeps URLs as written rather than percent-encoding them', () => {
    const [paragraph] = parseMarkdown(
      '[a](<https://example.com/a b?c=ü>) <https://x.example/&amp;> www.example.com',
    ).children

    expect(paragraph).toMatchObject({
      children: [
        { type: 'link', url: 'https://example.com/a b?c=ü' },
        { type: 'text', value: ' ' },
        { type: 'link', url: 'https://x.example/&amp;' },
        { type: 'text', value: ' ' },
        { type: 'link', url: 'http://www.example.com' },
      ],
    })
  })

  it('keeps footnote definitions in place, with lower-case identifiers', () => {
    expect(parseMarkdown('Text[^Note].\n\n[^Note]: Body.\n\nAfter.').children).toStrictEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Text' },
          { type: 'footnoteReference', identifier: 'note', label: 'Note' },
          { type: 'text', value: '.' },
        ],
      },
      {
        type: 'footnoteDefinition',
        identifier: 'note',
        label: 'Note',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body.' }] }],
      },
      { type: 'paragraph', children: [{ type: 'text', value: 'After.' }] },
    ])
  })

  it('splits a code fence info string into language and meta as written', () => {
    expect(parseMarkdown('``` js  title="a  b" \ncode\n```').children[0]).toStrictEqual({
      type: 'code',
      lang: 'js',
      meta: 'title="a  b"',
      value: 'code',
    })
  })

  it('marks a list as spread only when blank lines separate its items', () => {
    const [tight] = parseMarkdown('- a\n\n  b\n- c').children
    const [loose] = parseMarkdown('- a\n\n- b').children

    expect(tight).toMatchObject({ spread: false, children: [{ spread: true }, { spread: false }] })
    expect(loose).toMatchObject({ spread: true, children: [{ spread: false }, { spread: false }] })
  })

  it('drops the parser bookkeeping from breaks', () => {
    expect(parseMarkdown('a  \nb').children[0]).toStrictEqual({
      type: 'paragraph',
      children: [{ type: 'text', value: 'a' }, { type: 'break' }, { type: 'text', value: 'b' }],
    })
  })
})
