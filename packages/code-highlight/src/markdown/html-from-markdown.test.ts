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
})
