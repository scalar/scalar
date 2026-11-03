import { describe, expect, it } from 'vitest'

import { documentReferences } from './document-references'
import { documentTraversal } from './document-traversal'

describe('document-traversal', () => {
  it('does not read document children when location indexing is disabled', () => {
    const input = {
      get child(): never {
        throw new Error('unnecessary traversal')
      },
    }
    const traversal = documentTraversal(false, false, true, false)
    traversal.register(input, '/')
    expect(traversal.location(input)).toBeUndefined()
  })

  it('exposes and indexes only the selected subtree after initial registration', () => {
    let reads = 0
    const untouched = {
      get child(): object {
        reads++
        return {}
      },
    }
    const selected = { $id: './selected', $anchor: 'selected', properties: { nested: { $ref: '#selected' } } }
    const other = { $anchor: 'other' }
    const input = { openapi: '3.1.0', 'x-data': { selected, other }, untouched }
    const traversal = documentTraversal(true, false, true)
    const references = documentReferences(
      'x-ext',
      undefined,
      false,
      (node) => traversal.location(node)?.context !== 'data',
      (node) => traversal.location(node)?.context === 'schema',
    )
    traversal.register(input, 'https://example.com/root')
    references.register(input, 'https://example.com/root')
    const initialReads = reads
    traversal.register(input, 'https://example.com/root', 'schema', ['x-data', 'selected'])
    references.refresh(input, ['x-data', 'selected'])
    traversal.register(input, 'https://example.com/root', 'schema', ['x-data', 'other'])
    references.refresh(input, ['x-data', 'other'])
    expect(reads).toBe(initialReads)
    expect(traversal.location(input['x-data'])?.context).toBe('data-container')
    expect(traversal.location(selected)).toStrictEqual({
      source: 'https://example.com/root',
      pointer: '#/x-data/selected',
      context: 'schema',
      schemaSiblings: true,
    })
    expect(references.resolve('https://example.com/selected#selected', 'https://example.com/root')?.value).toBe(
      selected,
    )
    expect(references.resolve('#other', 'https://example.com/root')?.value).toBe(other)
    expect(references.origin(selected.properties.nested)).toBe('https://example.com/selected')
  })

  it('assigns authored source locations to previously embedded documents', () => {
    const external = { properties: { missing: { $ref: '#/absent' } } }
    const input = { 'x-ext': { external } }
    const traversal = documentTraversal(true, false, true)
    traversal.register(input, '/root.json')
    traversal.register(external, '/external.json')
    expect(traversal.location(external.properties.missing)).toStrictEqual({
      source: '/external.json',
      pointer: '#/properties/missing',
      context: 'schema',
      schemaSiblings: true,
    })
  })
})
