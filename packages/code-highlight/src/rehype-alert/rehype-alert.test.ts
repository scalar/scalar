import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { rehypeAlert } from './rehype-alert'

describe('rehype-alert', () => {
  const process = async (markdown: string) => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeAlert)
      .use(rehypeStringify)
      .process(markdown)

    return String(file)
  }

  it('transforms note alerts correctly', async () => {
    const input = '> [!note]\n> This is a note callout.'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-note">')
    expect(output).toContain('<div class="markdown-alert-content">')
    expect(output).toContain('This is a note callout.')
  })

  it('transforms warning alerts correctly', async () => {
    const input = '> [!warning]\n> This is a warning callout.'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-warning">')
    expect(output).toContain('This is a warning callout.')
  })

  it('transforms caution alerts correctly', async () => {
    const input = '> [!caution]\n> This is a caution callout.'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-caution">')
    expect(output).toContain('This is a caution callout.')
  })

  it('transforms important alerts correctly', async () => {
    const input = '> [!important]\n> This is an important callout.'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-important">')
    expect(output).toContain('This is an important callout.')
  })

  it('transforms tip alerts correctly', async () => {
    const input = '> [!tip]\n> This is a tip callout.'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-tip">')
    expect(output).toContain('This is a tip callout.')
  })

  it('ignores blockquotes without alert syntax', async () => {
    const input = '> This is a regular blockquote.'
    const output = await process(input)

    expect(output).not.toContain('markdown-alert')
    expect(output).toContain('<blockquote>')
    expect(output).toContain('This is a regular blockquote.')
  })

  it('ignores invalid alert types', async () => {
    const input = '> [!invalid]\n> This is an invalid alert type.'
    const output = await process(input)

    expect(output).not.toContain('markdown-alert')
    expect(output).toContain('<blockquote>')
    expect(output).toContain('[!invalid]')
    expect(output).toContain('This is an invalid alert type.')
  })

  it('handles multiline alert content correctly', async () => {
    const input = '> [!note]\n> First line\n> Second line\n> Third line'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-note">')
    expect(output).toContain('First line')
    expect(output).toContain('Second line')
    expect(output).toContain('Third line')
  })

  describe('content in its own block after the marker line', () => {
    const blocks = [
      {
        name: 'a fenced code block',
        markdown: '> ```sh\n> rm -rf ./build\n> ```',
        expected: '<pre><code class="language-sh">',
      },
      { name: 'a paragraph', markdown: '>\n> A separate paragraph.', expected: 'A separate paragraph.' },
      { name: 'a list', markdown: '> - first\n> - second', expected: '<li>first</li>' },
      { name: 'a table', markdown: '> | planet |\n> | --- |\n> | Mars |', expected: '<td>Mars</td>' },
    ]

    for (const type of ['note', 'tip', 'important', 'warning', 'caution', 'success']) {
      for (const block of blocks) {
        it(`keeps ${block.name} in a ${type} alert`, async () => {
          const output = await process(`> [!${type.toUpperCase()}]\n${block.markdown}`)

          expect(output).toContain(`<div class="markdown-alert markdown-alert-${type}">`)
          expect(output).toContain(block.expected)
        })
      }
    }

    it('keeps every block, not only the last', async () => {
      const output = await process('> [!NOTE]\n>\n> First paragraph.\n>\n> ```js\n> const answer = 42\n> ```')

      expect(output).toContain('First paragraph.')
      expect(output).toContain('const answer = 42')
    })

    it('does not repeat the marker in the content', async () => {
      const output = await process('> [!WARNING]\n> ```sh\n> rm -rf ./build\n> ```')

      expect(output).not.toContain('[!WARNING]')
    })
  })

  it('preserves HTML structure in alert content', async () => {
    const input = '> [!note]\n> This is a note with **bold** and *italic* text.'
    const output = await process(input)

    expect(output).toContain('<div class="markdown-alert markdown-alert-note">')
    expect(output).toContain('<strong>bold</strong>')
    expect(output).toContain('<em>italic</em>')
  })
})
