import { describe, expect, it } from 'vitest'

import {
  applyPostmanFolderSelectionChange,
  applyPostmanRequestSelectionChange,
  buildPostmanRequestTree,
  collectAllRequestPathKeys,
  collectRequestPathKeysUnderFolder,
  countPostmanRequestLeaves,
  countRequestLeaves,
  folderFullySelected,
  folderHasPartialSelection,
  getPostmanItemAtIndexPath,
  parsePostmanPathKey,
  pathKey,
  pathKeysToRequestIndexPaths,
} from './postman-request-tree'

describe('postman-request-tree', () => {
  it('round-trips pathKey to index paths for convert options', () => {
    const p0 = pathKey([0, 1])
    const p1 = pathKey([2])
    expect(parsePostmanPathKey(p0)).toEqual([0, 1])
    expect(parsePostmanPathKey('not json')).toBeUndefined()
    expect(parsePostmanPathKey(JSON.stringify([0, 1.5]))).toBeUndefined()
    expect(pathKeysToRequestIndexPaths([p0, p1, 'bad'])).toEqual([[0, 1], [2]])
  })

  it('builds a tree with paths and methods', () => {
    const tree = buildPostmanRequestTree([
      {
        name: 'Folder',
        item: [
          {
            name: 'Get user',
            request: { method: 'get', url: 'https://api.example.com/user' },
          },
        ],
      },
      {
        name: 'Health',
        request: 'https://api.example.com/health',
      },
    ])

    expect(tree).toHaveLength(2)
    expect(tree[0]?.isFolder).toBe(true)
    expect(tree[0]?.children?.[0]).toMatchObject({
      isFolder: false,
      method: 'get',
      path: [0, 0],
    })
    expect(tree[1]).toMatchObject({
      isFolder: false,
      method: 'get',
      path: [1],
    })
  })

  it('getPostmanItemAtIndexPath walks nested item arrays like the tree paths', () => {
    const items = [
      {
        name: 'Folder',
        item: [
          {
            name: 'Nested',
            request: { method: 'post', url: { raw: 'https://x.test/v1/a' } },
          },
        ],
      },
    ]
    expect(getPostmanItemAtIndexPath(items, [0, 0])).toMatchObject({
      name: 'Nested',
      request: { method: 'post' },
    })
    expect(getPostmanItemAtIndexPath(items, [0])).toMatchObject({ name: 'Folder', item: expect.any(Array) })
  })

  it('collects all request path keys', () => {
    const items = [
      {
        item: [{ name: 'A', request: {} }],
      },
      { name: 'B', request: {} },
    ]
    const tree = buildPostmanRequestTree(items)
    const keys = collectAllRequestPathKeys(tree)
    expect(keys).toEqual([pathKey([0, 0]), pathKey([1])])
    expect(countPostmanRequestLeaves(items)).toBe(keys.length)
  })

  it('counts zero leaves for non-array or empty item root', () => {
    expect(countPostmanRequestLeaves(undefined)).toBe(0)
    expect(countPostmanRequestLeaves([])).toBe(0)
  })

  it('collects keys under a folder', () => {
    const tree = buildPostmanRequestTree([
      {
        name: 'F',
        item: [
          { name: 'A', request: {} },
          { name: 'B', request: {} },
        ],
      },
    ])
    const folder = tree[0]
    expect(folder).toBeDefined()
    expect(collectRequestPathKeysUnderFolder(folder!)).toEqual([pathKey([0, 0]), pathKey([0, 1])])
  })

  it('applies request and folder selection changes immutably', () => {
    const tree = buildPostmanRequestTree([
      {
        name: 'F',
        item: [
          { name: 'A', request: {} },
          { name: 'B', request: {} },
        ],
      },
    ])
    const folder = tree[0]!
    const k0 = pathKey([0, 0])
    const k1 = pathKey([0, 1])
    const base: string[] = []
    expect(applyPostmanRequestSelectionChange(base, k0, true)).toEqual([k0])
    expect(base).toEqual([])
    expect(applyPostmanRequestSelectionChange([k0, k1], k0, false)).toEqual([k1])
    expect(applyPostmanFolderSelectionChange([], folder, true)).toEqual([k0, k1])
    expect(applyPostmanFolderSelectionChange([k0, k1], folder, false)).toEqual([])
  })

  it('counts request leaves under folders', () => {
    const tree = buildPostmanRequestTree([
      {
        name: 'Root',
        item: [
          { name: 'A', request: {} },
          {
            name: 'Sub',
            item: [{ name: 'B', request: {} }],
          },
        ],
      },
    ])
    const root = tree[0]!
    expect(countRequestLeaves(root)).toBe(2)
    expect(countRequestLeaves(root.children![1]!)).toBe(1)
  })

  it('reports folderHasPartialSelection', () => {
    const tree = buildPostmanRequestTree([
      {
        name: 'F',
        item: [
          { name: 'A', request: {} },
          { name: 'B', request: {} },
        ],
      },
    ])
    const folder = tree[0]!
    const k0 = pathKey([0, 0])
    const k1 = pathKey([0, 1])
    expect(folderHasPartialSelection(folder, new Set())).toBe(false)
    expect(folderHasPartialSelection(folder, new Set([k0]))).toBe(true)
    expect(folderHasPartialSelection(folder, new Set([k0, k1]))).toBe(false)
  })

  it('reports folderFullySelected', () => {
    const tree = buildPostmanRequestTree([
      {
        name: 'F',
        item: [{ name: 'A', request: {} }],
      },
    ])
    const folder = tree[0]!
    const keys = new Set(collectRequestPathKeysUnderFolder(folder))
    expect(folderFullySelected(folder, keys)).toBe(true)
    keys.delete(pathKey([0, 0]))
    expect(folderFullySelected(folder, keys)).toBe(false)
  })
})
