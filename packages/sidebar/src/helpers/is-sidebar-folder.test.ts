import { describe, expect, it } from 'vitest'

import { isSidebarFolder } from '@/helpers/is-sidebar-folder'
import type { Item } from '@/types'

describe('isSidebarFolder', () => {
  describe('client layout', () => {
    it('should return true for document type with empty slot and no children', () => {
      const item = {
        id: '1',
        type: 'document',
        title: 'Document 1',
        icon: 'icon',
        name: 'Document 1',
      } satisfies Item

      expect(isSidebarFolder('client', item, true)).toBe(true)
    })

    it('should return true for tag type with empty slot and no children', () => {
      const item = {
        id: '1',
        type: 'tag',
        title: 'Tag 1',
        name: 'Tag 1',
        isGroup: false,
      } satisfies Item

      expect(isSidebarFolder('client', item, true)).toBe(true)
    })

    it('should return false for document type without empty slot and no children', () => {
      const item = {
        id: '1',
        type: 'document',
        title: 'Document 1',
        icon: 'icon',
        name: 'Document 1',
      } satisfies Item

      expect(isSidebarFolder('client', item, false)).toBe(false)
    })

    it('should return false for tag type without empty slot and no children', () => {
      const item = {
        id: '1',
        type: 'tag',
        title: 'Tag 1',
        name: 'Tag 1',
        isGroup: false,
      } satisfies Item

      expect(isSidebarFolder('client', item, false)).toBe(false)
    })

    it('should return false for operation type with empty slot but no children', () => {
      const item = {
        id: '1',
        type: 'operation',
        title: 'GET /users',
        ref: 'ref-1',
        method: 'get',
        path: '/users',
      } satisfies Item

      expect(isSidebarFolder('client', item, true)).toBe(false)
    })

    it('should return true for any item with children in client layout', () => {
      const item = {
        id: '1',
        type: 'tag',
        title: 'Tag 1',
        name: 'Tag 1',
        isGroup: false,
        children: [
          {
            id: '2',
            type: 'operation',
            title: 'GET /users',
            ref: 'ref-1',
            method: 'get',
            path: '/users',
          },
        ],
      } satisfies Item

      expect(isSidebarFolder('client', item, false)).toBe(true)
      expect(isSidebarFolder('client', item, true)).toBe(true)
    })
  })

  describe('reference layout', () => {
    it('should return true for tag type with children', () => {
      const item = {
        id: '1',
        type: 'tag',
        title: 'Tag 1',
        name: 'Tag 1',
        isGroup: false,
        children: [
          {
            id: '2',
            type: 'operation',
            title: 'GET /users',
            ref: 'ref-1',
            method: 'get',
            path: '/users',
          },
        ],
      } satisfies Item

      expect(isSidebarFolder('reference', item, false)).toBe(true)
    })

    it('should return true for document type with children', () => {
      const item = {
        id: '1',
        type: 'document',
        title: 'Document 1',
        icon: 'icon',
        name: 'Document 1',
        children: [
          {
            id: '2',
            type: 'operation',
            title: 'GET /users',
            ref: 'ref-1',
            method: 'get',
            path: '/users',
          },
        ],
      } satisfies Item

      expect(isSidebarFolder('reference', item, false)).toBe(true)
    })

    it('should return false for operation type with children in reference layout', () => {
      const item = {
        id: '1',
        type: 'operation',
        title: 'GET /users',
        ref: 'ref-1',
        method: 'get',
        path: '/users',
        children: [
          {
            id: '2',
            type: 'operation',
            title: 'GET /users/:id',
            ref: 'ref-2',
            method: 'get',
            path: '/users/:id',
          },
        ],
      } satisfies Item

      expect(isSidebarFolder('reference', item, false)).toBe(false)
    })

    it('should return false for tag type without children in reference layout', () => {
      const item = {
        id: '1',
        type: 'tag',
        title: 'Tag 1',
        name: 'Tag 1',
        isGroup: false,
      } satisfies Item

      expect(isSidebarFolder('reference', item, false)).toBe(false)
    })
  })

  it('should return false when children array exists but is empty', () => {
    const item = {
      id: '1',
      type: 'tag',
      title: 'Tag 1',
      name: 'Tag 1',
      isGroup: false,
      children: [],
    } satisfies Item

    expect(isSidebarFolder('client', item, false)).toBe(false)
    expect(isSidebarFolder('reference', item, false)).toBe(false)
  })
})
