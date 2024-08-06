import { describe, expect, it } from 'vitest'

import { htmlFromMarkdown } from './markdown'

describe('htmlFromMarkdown', () => {
  it('returns HTML', () => {
    const html = htmlFromMarkdown(`# Example Heading`)

    expect(html.trim()).toEqual('<h1>Example Heading</h1>')
  })

  it('allows to add ids', () => {
    const html = htmlFromMarkdown(`# Example Heading`, {
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
