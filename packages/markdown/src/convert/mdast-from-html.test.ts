import { describe, expect, it } from 'vitest'

import { htmlFromMarkdown } from '../pipeline/pipeline'
import { mdastFromHtml } from './mdast-from-html'

describe('mdast-from-html', () => {
  it('converts block and inline elements', () => {
    expect(
      mdastFromHtml('<h2>Title</h2>\n<p>Some <strong>bold</strong> and <code>a  b</code>.</p>').children,
    ).toStrictEqual([
      { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Title' }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Some ' },
          { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
          { type: 'text', value: ' and ' },
          { type: 'inlineCode', value: 'a b' },
          { type: 'text', value: '.' },
        ],
      },
    ])
  })

  it('removes what the sanitizer removes, keeping the text of unknown elements', () => {
    expect(
      mdastFromHtml('<p>Hello <custom>world</custom></p><script>alert(1)</script><a href="javascript:x">y</a>')
        .children,
    ).toStrictEqual([
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello world' }] },
      {
        type: 'paragraph',
        children: [{ type: 'link', url: '', title: null, children: [{ type: 'text', value: 'y' }] }],
      },
    ])
  })

  it('reads code blocks with their language and without the trailing line ending', () => {
    expect(
      mdastFromHtml('<pre><code class="hljs language-js custom-scroll"><span>let</span> a\n</code></pre>').children,
    ).toStrictEqual([{ type: 'code', lang: 'js', meta: null, value: 'let a' }])
    // The HTML parser drops a line ending right after `<pre>`.
    expect(mdastFromHtml('<pre>\nx</pre>').children).toStrictEqual([
      { type: 'code', lang: null, meta: null, value: 'x' },
    ])
  })

  it('turns leading checkboxes into task list items', () => {
    const [list] = mdastFromHtml(htmlFromMarkdown('- [x] done\n- [ ] todo')).children

    expect(list).toStrictEqual({
      type: 'list',
      ordered: false,
      start: null,
      spread: false,
      children: [
        {
          type: 'listItem',
          spread: false,
          checked: true,
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'done' }] }],
        },
        {
          type: 'listItem',
          spread: false,
          checked: false,
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'todo' }] }],
        },
      ],
    })
  })

  it('reads ordered lists with their start', () => {
    expect(mdastFromHtml('<ol start="3"><li>a</li></ol>').children[0]).toMatchObject({ ordered: true, start: 3 })
  })

  it('builds tables with a header row and alignment', () => {
    expect(mdastFromHtml(htmlFromMarkdown('| a | b |\n| -: | - |\n| 1 | 2 |')).children[0]).toStrictEqual({
      type: 'table',
      align: ['right', null],
      children: [
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', children: [{ type: 'text', value: 'a' }] },
            { type: 'tableCell', children: [{ type: 'text', value: 'b' }] },
          ],
        },
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', children: [{ type: 'text', value: '1' }] },
            { type: 'tableCell', children: [{ type: 'text', value: '2' }] },
          ],
        },
      ],
    })
  })

  it('adds the rows a cell implies and moves what a table cannot hold before it, as the HTML parser does', () => {
    const tree = mdastFromHtml('<table><tr><td>a</td></tr><td>b</td></tr><tr><td>c</td></tr>stray</table>')

    expect(tree.children[0]).toStrictEqual({ type: 'paragraph', children: [{ type: 'text', value: 'stray' }] })
    expect(tree.children[1]).toMatchObject({
      type: 'table',
      children: [
        // Without a `<th>` or `<thead>`, the header row is empty.
        { type: 'tableRow', children: [{ type: 'tableCell', children: [] }] },
        { type: 'tableRow', children: [{ children: [{ value: 'a' }] }] },
        { type: 'tableRow', children: [{ children: [{ value: 'b' }] }] },
        { type: 'tableRow', children: [{ children: [{ value: 'c' }] }] },
      ],
    })
  })

  it('collapses whitespace as a browser renders it', () => {
    expect(mdastFromHtml('<p>\n  a\n  <em> b </em>  c\n</p>').children).toStrictEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'a ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'b ' }] },
          { type: 'text', value: 'c' },
        ],
      },
    ])
  })

  it('makes a definition list a list of terms and descriptions', () => {
    expect(mdastFromHtml('<dl><dt>Term</dt><dd>Description</dd></dl>').children[0]).toMatchObject({
      type: 'list',
      children: [
        {
          type: 'listItem',
          spread: true,
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'Term' }] },
            { type: 'paragraph', children: [{ type: 'text', value: 'Description' }] },
          ],
        },
      ],
    })
  })

  it('quotes the content of q elements', () => {
    expect(mdastFromHtml('<p><q>hi</q></p>').children[0]).toStrictEqual({
      type: 'paragraph',
      children: [{ type: 'text', value: '"hi"' }],
    })
  })
})
