import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { generateReverseIndex } from './generate-reverse-index'

describe('generateReverseIndex', () => {
  it('returns empty map for empty navigation', () => {
    const result = generateReverseIndex([])
    expect(result.size).toBe(0)
  })

  it('indexes a single node', () => {
    const node: TraversedEntry = { id: 'a', title: 'Node A', type: 'operation', method: 'get', path: '/a', ref: '' }
    const result = generateReverseIndex([node])
    expect(result.size).toBe(1)
    expect(result.get('a')).toEqual(node)
  })

  it('indexes nested children', () => {
    const node: TraversedEntry = {
      id: 'root',
      title: 'Root',
      type: 'tag',
      isGroup: false,
      name: '',
      children: [
        { id: 'child1', title: 'Child 1', type: 'webhook', method: 'get', name: '', ref: '' },
        {
          id: 'child2',
          title: 'Child 2',
          type: 'text',
          children: [{ type: 'text', id: 'grandchild', title: 'Grandchild' }],
        },
      ],
    }
    const result = generateReverseIndex([node])
    expect(result.size).toBe(4)
    expect(result.get('root')).toMatchObject(node)
    expect(result.get('child1')).toMatchObject(node.children?.[0] as any)
    expect(result.get('child2')).toMatchObject(node.children?.[1] as any)
    expect(result.get('grandchild')).toMatchObject((node.children?.[1] as any).children?.[0])
  })

  it('indexes multiple top-level nodes', () => {
    const nodes: TraversedEntry[] = [
      { id: 'a', title: 'A', type: 'operation', method: 'get', path: '/a', ref: '' },
      { id: 'b', title: 'B', type: 'text', children: [{ type: 'text', id: 'c', title: 'C' }] },
    ]
    const result = generateReverseIndex(nodes)
    expect(result.size).toBe(3)
    expect(result.get('a')).toBe(nodes[0])
    expect(result.get('b')).toBe(nodes[1])
    expect(result.get('c')).toEqual({ ...(nodes[1] as any).children?.[0], parent: nodes[1] })
  })
})
