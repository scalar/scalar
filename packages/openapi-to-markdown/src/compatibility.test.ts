import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'
import fixture from './fixtures/compatibility.json'

describe('compatibility', () => {
  it('renders recursive schemas and resolved examples', async () => {
    const markdown = await createMarkdownFromOpenApi(fixture)

    expect(markdown).toContain('**Example:**')
    expect(markdown).toContain('*\\[Circular Reference]*')
    expect(markdown).toContain('"owner": {')
    expect(markdown).toContain('"parent": {')
  })
})
