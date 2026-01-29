import type { TraversedEntry, WithParent } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import type { FuseData } from '@/v2/features/search/types'

import { getFuseItems } from './get-fuse-items'

describe('getFuseItems', () => {
  it('returns entries with their parent chain', () => {
    // Create a document entry (root)
    const documentEntry: TraversedEntry = {
      id: 'doc-1',
      type: 'document',
      title: 'API Documentation',
      children: [],
    }

    // Create a tag entry (parent)
    const tagEntry: WithParent<TraversedEntry> = {
      id: 'tag-1',
      type: 'tag',
      title: 'Pets',
      description: 'Pet operations',
      isGroup: false,
      children: [],
      parent: documentEntry,
    }

    // Create an operation entry (child)
    const operationEntry: TraversedEntry = {
      id: 'op-1',
      type: 'operation',
      title: 'Get Pet',
      method: 'get',
      path: '/pets/{id}',
      ref: '#/paths/~1pets~1{id}/get',
    }

    // Create FuseData with parent chain
    const fuseData: FuseData = {
      id: 'op-1',
      type: 'operation',
      title: 'Get Pet',
      description: 'Retrieve a pet by ID',
      method: 'get',
      path: '/pets/{id}',
      entry: operationEntry,
      parent: tagEntry,
      documentName: 'API Documentation',
    }

    // Mock Fuse result
    const fuseResults = [
      {
        item: fuseData,
        refIndex: 0,
      },
    ]

    const items = getFuseItems(fuseResults)

    // Should include document, parent tag, and the operation
    expect(items).toHaveLength(3)
    expect(items[0]?.id).toBe('doc-1')
    expect(items[0]?.type).toBe('document')
    expect(items[1]?.id).toBe('tag-1')
    expect(items[1]?.type).toBe('tag')
    expect(items[2]?.id).toBe('op-1')
    expect(items[2]?.type).toBe('operation')
  })

  it('deduplicates parents when multiple children match', () => {
    const documentEntry: TraversedEntry = {
      id: 'doc-1',
      type: 'document',
      title: 'API Documentation',
      children: [],
    }

    const tagEntry: WithParent<TraversedEntry> = {
      id: 'tag-1',
      type: 'tag',
      title: 'Pets',
      description: 'Pet operations',
      isGroup: false,
      children: [],
      parent: documentEntry,
    }

    const operation1: TraversedEntry = {
      id: 'op-1',
      type: 'operation',
      title: 'Get Pet',
      method: 'get',
      path: '/pets/{id}',
      ref: '#/paths/~1pets~1{id}/get',
    }

    const operation2: TraversedEntry = {
      id: 'op-2',
      type: 'operation',
      title: 'List Pets',
      method: 'get',
      path: '/pets',
      ref: '#/paths/~1pets/get',
    }

    const fuseResults = [
      {
        item: {
          id: 'op-1',
          type: 'operation' as const,
          title: 'Get Pet',
          description: '',
          method: 'get',
          path: '/pets/{id}',
          entry: operation1,
          parent: tagEntry,
          documentName: 'API Documentation',
        },
        refIndex: 0,
      },
      {
        item: {
          id: 'op-2',
          type: 'operation' as const,
          title: 'List Pets',
          description: '',
          method: 'get',
          path: '/pets',
          entry: operation2,
          parent: tagEntry,
          documentName: 'API Documentation',
        },
        refIndex: 1,
      },
    ]

    const items = getFuseItems(fuseResults)

    // Should include document, parent tag once, plus both operations
    expect(items).toHaveLength(4)
    expect(items[0]?.id).toBe('doc-1')
    expect(items[1]?.id).toBe('tag-1')
    expect(items[2]?.id).toBe('op-1')
    expect(items[3]?.id).toBe('op-2')
  })

  it('filters out non-API-client types', () => {
    const textEntry: TraversedEntry = {
      id: 'text-1',
      type: 'text',
      title: 'Introduction',
      value: 'Welcome to the API',
      depth: 1,
    }

    const fuseResults = [
      {
        item: {
          id: 'text-1',
          type: 'heading' as const,
          title: 'Introduction',
          description: '',
          entry: textEntry,
          documentName: 'API Documentation',
        },
        refIndex: 0,
      },
    ]

    const items = getFuseItems(fuseResults)

    // Text/heading entries should be filtered out
    expect(items).toHaveLength(0)
  })

  it('builds complete parent chain for deeply nested entries', () => {
    const documentEntry: TraversedEntry = {
      id: 'doc-1',
      type: 'document',
      title: 'API Documentation',
      children: [],
    }

    const tagGroupEntry: WithParent<TraversedEntry> = {
      id: 'tag-group-1',
      type: 'tag',
      title: 'Animals',
      description: 'Animal operations',
      isGroup: true,
      children: [],
      parent: documentEntry,
    }

    const tagEntry: WithParent<TraversedEntry> = {
      id: 'tag-1',
      type: 'tag',
      title: 'Pets',
      description: 'Pet operations',
      isGroup: false,
      children: [],
      parent: tagGroupEntry,
    }

    const operationEntry: TraversedEntry = {
      id: 'op-1',
      type: 'operation',
      title: 'Get Pet',
      method: 'get',
      path: '/pets/{id}',
      ref: '#/paths/~1pets~1{id}/get',
    }

    const fuseResults = [
      {
        item: {
          id: 'op-1',
          type: 'operation' as const,
          title: 'Get Pet',
          description: '',
          method: 'get',
          path: '/pets/{id}',
          entry: operationEntry,
          parent: tagEntry,
          documentName: 'API Documentation',
        },
        refIndex: 0,
      },
    ]

    const items = getFuseItems(fuseResults)

    // Should include document, tag group, tag, and operation
    expect(items).toHaveLength(4)
    expect(items[0]?.id).toBe('doc-1')
    expect(items[0]?.type).toBe('document')
    expect(items[1]?.id).toBe('tag-group-1')
    expect(items[1]?.type).toBe('tag')
    expect(items[2]?.id).toBe('tag-1')
    expect(items[2]?.type).toBe('tag')
    expect(items[3]?.id).toBe('op-1')
    expect(items[3]?.type).toBe('operation')
  })
})
