import { describe, expect, it } from 'vitest'

import { createMarkdownSerializer, mdastFromHtml, parseMarkdown } from './mdast'

describe('mdast', () => {
  it('parses GitHub Flavored Markdown', () => {
    const tree = parseMarkdown('| a |\n| - |\n| b |\n\n~~gone~~')

    expect(tree.children.map((node) => node.type)).toEqual(['table', 'paragraph'])
    expect(tree.children[1]).toMatchObject({ children: [{ type: 'delete' }] })
  })

  it('converts HTML to mdast and drops what the sanitizer removes', () => {
    const tree = mdastFromHtml('<p>Hello <strong>world</strong></p><script>alert(1)</script>')

    expect(tree.children).toHaveLength(1)
    expect(tree.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', value: 'Hello ' }, { type: 'strong' }],
    })
  })

  it('serializes mdast with the options it was created with', () => {
    const tree = parseMarkdown('* one\n* two')

    expect(createMarkdownSerializer()(tree)).toBe('* one\n* two\n')
    expect(createMarkdownSerializer({ bullet: '-' })(tree)).toBe('- one\n- two\n')
  })

  it('round-trips a GFM table', () => {
    const markdown = '| a | b |\n| - | - |\n| 1 | 2 |\n'

    expect(createMarkdownSerializer()(parseMarkdown(markdown))).toBe(markdown)
  })
})
