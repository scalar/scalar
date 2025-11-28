import { describe, expect, it } from 'vitest'

import type { TraversedEntry } from '@/schemas/navigation'

import { getParentEntry } from './get-parent-entry'

describe('getParentEntry', () => {
  it('returns undefined when node is undefined', () => {
    const result = getParentEntry('tag', undefined)

    expect(result).toBeUndefined()
  })

  it('returns node when it matches the type (self match)', () => {
    const node: TraversedEntry & { parent?: TraversedEntry } = {
      id: 'tag-1',
      type: 'tag',
      title: 'Users',
      name: 'Users',
      isGroup: true,
    }

    const result = getParentEntry('tag', node)

    expect(result).toBeDefined()
    expect(result?.id).toBe('tag-1')
    expect(result?.type).toBe('tag')
  })

  it('finds parent of specified type when traversing up the tree', () => {
    const document: TraversedEntry = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'Test API',
    }

    const tag: TraversedEntry & { parent: TraversedEntry } = {
      id: 'tag-1',
      type: 'tag',
      title: 'Users',
      name: 'Users',
      isGroup: true,
      parent: document,
    }

    const operation: TraversedEntry & { parent: TraversedEntry } = {
      id: 'op-1',
      type: 'operation',
      title: 'Get users',
      ref: 'op-ref-1',
      method: 'get',
      path: '/users',
      parent: tag,
    }

    const result = getParentEntry('tag', operation)

    expect(result).toBeDefined()
    expect(result?.id).toBe('tag-1')
    expect(result?.type).toBe('tag')
  })

  it('returns undefined when no parent matches the type', () => {
    const document: TraversedEntry = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'Test API',
    }

    const operation: TraversedEntry & { parent: TraversedEntry } = {
      id: 'op-1',
      type: 'operation',
      title: 'Get users',
      ref: 'op-ref-1',
      method: 'get',
      path: '/users',
      parent: document,
    }

    const result = getParentEntry('tag', operation)

    expect(result).toBeUndefined()
  })

  it('finds distant ancestor when immediate parent does not match', () => {
    const document: TraversedEntry = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'Test API',
    }

    const tag: TraversedEntry & { parent: TraversedEntry } = {
      id: 'tag-1',
      type: 'tag',
      title: 'Users',
      name: 'Users',
      isGroup: true,
      parent: document,
    }

    const operation: TraversedEntry & { parent: TraversedEntry } = {
      id: 'op-1',
      type: 'operation',
      title: 'Get users',
      ref: 'op-ref-1',
      method: 'get',
      path: '/users',
      parent: tag,
    }

    const example: TraversedEntry & { parent: TraversedEntry } = {
      id: 'example-1',
      type: 'example',
      title: 'Example request',
      name: 'Example 1',
      parent: operation,
    }

    const result = getParentEntry('document', example)

    expect(result).toBeDefined()
    expect(result?.id).toBe('doc-1')
    expect(result?.type).toBe('document')
  })
})
