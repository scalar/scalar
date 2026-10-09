import { readFileSync } from 'node:fs'

import type { Nodes } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'
import fixture from './fixtures/compatibility.json'

const parser = unified().use(remarkParse).use(remarkGfm)

/** Ignore only list spacing and boundary whitespace; code and document structure remain exact. */
const semanticTree = (node: Nodes): unknown => {
  const entries = Object.entries(node).filter(([key]) => key !== 'position' && key !== 'spread')
  return Object.fromEntries(
    entries.map(([key, value]) => {
      if (key === 'value' && node.type === 'text') {
        return [key, node.value.replace(/\s+/g, ' ').trim()]
      }
      if (key === 'value' && node.type === 'code' && node.lang === 'json') {
        return [key, JSON.stringify(JSON.parse(node.value))]
      }
      if (key === 'children' && 'children' in node) {
        return [key, node.children.filter((child) => child.type !== 'text' || child.value.trim()).map(semanticTree)]
      }
      return [key, value]
    }),
  )
}

describe('compatibility', () => {
  it('preserves document structure and content with explicit metadata, ancestor cycle detection, and shared schemas', async () => {
    // Shared schemas have canonical definitions in the appendix; operations link to them.
    // The fixture also preserves metadata, authored examples, and anonymous XML schemas.
    const expected = readFileSync(new URL('./fixtures/compatibility.md', import.meta.url), 'utf8')
    const markdown = await createMarkdownFromOpenApi(fixture)
    expect(semanticTree(parser.parse(markdown))).toStrictEqual(semanticTree(parser.parse(expected)))
    expect(markdown).toContain('\"owner\": {')
  })
})
