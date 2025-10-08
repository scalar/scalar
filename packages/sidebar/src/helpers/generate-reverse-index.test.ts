import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { generateReverseIndex } from './generate-reverse-index'

describe('generateReverseIndex', () => {
  it('returns empty map for empty navigation', () => {
    const result = generateReverseIndex([])
    expect(result.size).toBe(0)
  })

  it('indexes a single node', () => {
    const node: TraversedEntry = {
      id: 'a',
      title: 'Node A',
      type: 'operation',
      method: 'get',
      path: '/a',
      ref: '',
    }
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
        {
          id: 'child1',
          title: 'Child 1',
          type: 'webhook',
          method: 'get',
          name: '',
          ref: '',
        },
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
      {
        id: 'a',
        title: 'A',
        type: 'operation',
        method: 'get',
        path: '/a',
        ref: '',
      },
      {
        id: 'b',
        title: 'B',
        type: 'text',
        children: [{ type: 'text', id: 'c', title: 'C' }],
      },
    ]
    const result = generateReverseIndex(nodes)
    expect(result.size).toBe(3)
    expect(result.get('a')).toBe(nodes[0])
    expect(result.get('b')).toBe(nodes[1])
    expect(result.get('c')).toEqual({
      ...(nodes[1] as any).children?.[0],
      parent: nodes[1],
    })
  })

  it('attaches correct parent references', () => {
    const nodes: TraversedEntry[] = [
      {
        id: 'parent',
        title: 'Parent',
        type: 'tag',
        isGroup: false,
        name: '',
        children: [
          { id: 'child1', title: 'Child 1', type: 'text' },
          { id: 'child2', title: 'Child 2', type: 'text' },
        ],
      },
    ]
    const result = generateReverseIndex(nodes)
    const child1 = result.get('child1')
    const child2 = result.get('child2')
    const parent = result.get('parent')

    expect(child1?.parent).toBe(parent)
    expect(child2?.parent).toBe(parent)
  })

  it('does not attach parent to root nodes', () => {
    const nodes: TraversedEntry[] = [
      { id: 'root1', title: 'Root 1', type: 'text' },
      { id: 'root2', title: 'Root 2', type: 'text' },
    ]
    const result = generateReverseIndex(nodes)

    expect(result.get('root1')?.parent).toBeUndefined()
    expect(result.get('root2')?.parent).toBeUndefined()
  })

  it('handles deep nesting correctly', () => {
    const nodes: TraversedEntry[] = [
      {
        id: 'level1',
        title: 'Level 1',
        type: 'tag',
        isGroup: false,
        name: '',
        children: [
          {
            id: 'level2',
            title: 'Level 2',
            type: 'tag',
            isGroup: false,
            name: '',
            children: [
              {
                id: 'level3',
                title: 'Level 3',
                type: 'tag',
                isGroup: false,
                name: '',
                children: [{ id: 'level4', title: 'Level 4', type: 'text' }],
              },
            ],
          },
        ],
      },
    ]
    const result = generateReverseIndex(nodes)

    expect(result.size).toBe(4)
    expect(result.get('level4')?.parent?.id).toBe('level3')
    expect(result.get('level3')?.parent?.id).toBe('level2')
    expect(result.get('level2')?.parent?.id).toBe('level1')
    expect(result.get('level1')?.parent).toBeUndefined()
  })

  it('handles nodes with empty children array', () => {
    const nodes: TraversedEntry[] = [
      {
        id: 'parent',
        title: 'Parent',
        type: 'tag',
        isGroup: false,
        name: '',
        children: [],
      },
    ]
    const result = generateReverseIndex(nodes)

    expect(result.size).toBe(1)
    expect(result.get('parent')).toMatchObject({
      id: 'parent',
      title: 'Parent',
    })
  })

  it('handles nodes without children property', () => {
    const nodes: TraversedEntry[] = [
      { id: 'leaf1', title: 'Leaf 1', type: 'text' },
      {
        id: 'leaf2',
        title: 'Leaf 2',
        type: 'operation',
        method: 'post',
        path: '/test',
        ref: '',
      },
    ]
    const result = generateReverseIndex(nodes)

    expect(result.size).toBe(2)
    expect(result.get('leaf1')).toBe(nodes[0])
    expect(result.get('leaf2')).toBe(nodes[1])
  })

  it('uses custom nested key', () => {
    type CustomNode = { id: string; items?: CustomNode[] }
    const nodes: CustomNode[] = [
      {
        id: 'root',
        items: [
          { id: 'child1' },
          {
            id: 'child2',
            items: [{ id: 'grandchild' }],
          },
        ],
      },
    ]
    const result = generateReverseIndex(nodes, 'items')

    expect(result.size).toBe(4)
    expect(result.get('root')).toBeDefined()
    expect(result.get('child1')).toBeDefined()
    expect(result.get('child2')).toBeDefined()
    expect(result.get('grandchild')).toBeDefined()
  })

  it('handles duplicate IDs by overwriting', () => {
    const nodes: TraversedEntry[] = [
      { id: 'duplicate', title: 'First', type: 'text' },
      { id: 'duplicate', title: 'Second', type: 'text' },
    ]
    const result = generateReverseIndex(nodes)

    // Map will contain the last occurrence
    expect(result.size).toBe(1)
    expect(result.get('duplicate')?.title).toBe('Second')
  })

  it('handles complex mixed structure', () => {
    const nodes: TraversedEntry[] = [
      {
        id: 'tag1',
        title: 'Tag 1',
        type: 'tag',
        isGroup: false,
        name: '',
        children: [
          {
            id: 'op1',
            title: 'Operation 1',
            type: 'operation',
            method: 'get',
            path: '/op1',
            ref: '',
          },
          {
            id: 'op2',
            title: 'Operation 2',
            type: 'operation',
            method: 'post',
            path: '/op2',
            ref: '',
          },
        ],
      },
      {
        id: 'tag2',
        title: 'Tag 2',
        type: 'tag',
        isGroup: false,
        name: '',
        children: [
          {
            id: 'nested-tag',
            title: 'Nested Tag',
            type: 'tag',
            isGroup: false,
            name: '',
            children: [
              {
                id: 'webhook1',
                title: 'Webhook',
                type: 'webhook',
                method: 'post',
                name: 'webhook',
                ref: '',
              },
            ],
          },
        ],
      },
      { id: 'standalone', title: 'Standalone', type: 'text' },
    ]
    const result = generateReverseIndex(nodes)

    expect(result.size).toBe(7)
    expect(result.get('tag1')?.parent).toBeUndefined()
    expect(result.get('tag2')?.parent).toBeUndefined()
    expect(result.get('standalone')?.parent).toBeUndefined()
    expect(result.get('op1')?.parent?.id).toBe('tag1')
    expect(result.get('op2')?.parent?.id).toBe('tag1')
    expect(result.get('nested-tag')?.parent?.id).toBe('tag2')
    expect(result.get('webhook1')?.parent?.id).toBe('nested-tag')
  })

  it('handles large tree with many nodes', () => {
    const nodes: TraversedEntry[] = []

    // Create a tree with 100 nodes
    for (let i = 0; i < 10; i++) {
      const children: TraversedEntry[] = []
      for (let j = 0; j < 10; j++) {
        children.push({
          id: `node-${i}-${j}`,
          title: `Node ${i}-${j}`,
          type: 'text',
        })
      }
      nodes.push({
        id: `parent-${i}`,
        title: `Parent ${i}`,
        type: 'tag',
        isGroup: false,
        name: '',
        children,
      })
    }

    const result = generateReverseIndex(nodes)

    expect(result.size).toBe(110) // 10 parents + 100 children
    expect(result.get('parent-0')).toBeDefined()
    expect(result.get('node-0-0')?.parent?.id).toBe('parent-0')
    expect(result.get('node-9-9')?.parent?.id).toBe('parent-9')
  })
})
