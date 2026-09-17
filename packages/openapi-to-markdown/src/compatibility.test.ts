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
      if (key === 'value' && node.type === 'text') return [key, node.value.replace(/\s+/g, ' ').trim()]
      if (key === 'value' && node.type === 'code' && node.lang === 'json') {
        const example = JSON.parse(node.value) as Record<string, unknown>
        // Plain reference links now populate recursive example fields that the legacy loader left null.
        if ('owner' in example) example.owner = null
        if ('parent' in example) example.parent = null
        return [key, JSON.stringify(example)]
      }
      if (key === 'children' && 'children' in node)
        return [key, node.children.filter((child) => child.type !== 'text' || child.value.trim()).map(semanticTree)]
      return [key, value]
    }),
  )
}

describe('compatibility', () => {
  it('preserves the legacy document structure and content while resolving recursive example references', async () => {
    // Captured from the unmodified renderer at f3c39a6723, not from the implementation under test.
    const legacy = readFileSync(new URL('./fixtures/legacy.md', import.meta.url), 'utf8')
    const markdown = await createMarkdownFromOpenApi(fixture)
    expect(semanticTree(parser.parse(markdown))).toStrictEqual(semanticTree(parser.parse(legacy)))
    expect(markdown).toContain('\"owner\": {')
  })
})
