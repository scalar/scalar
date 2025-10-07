import { describe, expect, it, vi } from 'vitest'

import { createSidebarState } from './create-sidebar-state'

type SidebarItem = {
  id: string
  title: string
  children?: SidebarItem[]
}

describe('create-sidebar-state', () => {
  describe('initialization', () => {
    it('creates sidebar state with empty items', () => {
      const state = createSidebarState([])

      expect(state.items).toEqual([])
      expect(state.index.size).toBe(0)
      expect(state.selectedItems.value).toEqual({})
      expect(state.expandedItems.value).toEqual({})
    })

    it('creates sidebar state with flat items', () => {
      const items: SidebarItem[] = [
        { id: 'item1', title: 'Item 1' },
        { id: 'item2', title: 'Item 2' },
      ]
      const state = createSidebarState(items)

      expect(state.items).toEqual(items)
      expect(state.index.size).toBe(2)
      expect(state.index.get('item1')).toBeDefined()
      expect(state.index.get('item2')).toBeDefined()
    })

    it('creates sidebar state with nested items', () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            { id: 'child1', title: 'Child 1' },
            {
              id: 'child2',
              title: 'Child 2',
              children: [{ id: 'grandchild', title: 'Grandchild' }],
            },
          ],
        },
      ]
      const state = createSidebarState(items)

      expect(state.items).toEqual(items)
      expect(state.index.size).toBe(4)
      expect(state.index.get('root')).toBeDefined()
      expect(state.index.get('child1')).toBeDefined()
      expect(state.index.get('child2')).toBeDefined()
      expect(state.index.get('grandchild')).toBeDefined()
    })

    it('creates sidebar state with custom children key', () => {
      type CustomItem = {
        id: string
        title: string
        items?: CustomItem[]
      }

      const items: CustomItem[] = [
        {
          id: 'root',
          title: 'Root',
          items: [{ id: 'child', title: 'Child' }],
        },
      ]
      const state = createSidebarState(items, { key: 'items' })

      expect(state.index.size).toBe(2)
      expect(state.index.get('root')).toBeDefined()
      expect(state.index.get('child')).toBeDefined()
    })
  })

  describe('setSelected', () => {
    it('selects a single item', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const state = createSidebarState(items)

      await state.setSelected('item1')

      expect(state.selectedItems.value).toEqual({ item1: true })
    })

    it('selects a nested item and marks all parents as selected', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            {
              id: 'child',
              title: 'Child',
              children: [{ id: 'grandchild', title: 'Grandchild' }],
            },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setSelected('grandchild')

      expect(state.selectedItems.value).toEqual({
        grandchild: true,
        child: true,
        root: true,
      })
    })

    it('clears previous selection when selecting a new item', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            { id: 'child1', title: 'Child 1' },
            { id: 'child2', title: 'Child 2' },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setSelected('child1')
      expect(state.selectedItems.value).toEqual({ child1: true, root: true })

      await state.setSelected('child2')
      expect(state.selectedItems.value).toEqual({ child2: true, root: true })
    })

    it('handles selecting non-existent item', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const state = createSidebarState(items)

      await state.setSelected('non-existent')

      expect(state.selectedItems.value).toEqual({})
    })

    it('handles deeply nested item selection', async () => {
      const items: SidebarItem[] = [
        {
          id: 'level1',
          title: 'Level 1',
          children: [
            {
              id: 'level2',
              title: 'Level 2',
              children: [
                {
                  id: 'level3',
                  title: 'Level 3',
                  children: [
                    {
                      id: 'level4',
                      title: 'Level 4',
                      children: [{ id: 'level5', title: 'Level 5' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setSelected('level5')

      expect(state.selectedItems.value).toEqual({
        level5: true,
        level4: true,
        level3: true,
        level2: true,
        level1: true,
      })
    })

    it('calls onBeforeSelect hook', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onBeforeSelect = vi.fn()
      const state = createSidebarState(items, {
        hooks: { onBeforeSelect },
      })

      await state.setSelected('item1')

      expect(onBeforeSelect).toHaveBeenCalledWith('item1')
      expect(onBeforeSelect).toHaveBeenCalledTimes(1)
    })

    it('calls onAfterSelect hook', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onAfterSelect = vi.fn()
      const state = createSidebarState(items, {
        hooks: { onAfterSelect },
      })

      await state.setSelected('item1')

      expect(onAfterSelect).toHaveBeenCalledWith('item1')
      expect(onAfterSelect).toHaveBeenCalledTimes(1)
    })

    it('calls hooks in correct order', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const callOrder: string[] = []

      const onBeforeSelect = vi.fn(() => {
        callOrder.push('before')
      })
      const onAfterSelect = vi.fn(() => {
        callOrder.push('after')
      })

      const state = createSidebarState(items, {
        hooks: { onBeforeSelect, onAfterSelect },
      })

      await state.setSelected('item1')

      expect(callOrder).toEqual(['before', 'after'])
    })

    it('handles async hooks', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      let asyncValue = 'initial'

      const onBeforeSelect = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        asyncValue = 'before'
      })

      const onAfterSelect = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        asyncValue = 'after'
      })

      const state = createSidebarState(items, {
        hooks: { onBeforeSelect, onAfterSelect },
      })

      await state.setSelected('item1')

      expect(asyncValue).toBe('after')
      expect(onBeforeSelect).toHaveBeenCalled()
      expect(onAfterSelect).toHaveBeenCalled()
    })

    it('updates selection even if hooks are not provided', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const state = createSidebarState(items)

      await state.setSelected('item1')

      expect(state.selectedItems.value).toEqual({ item1: true })
    })
  })

  describe('setExpanded', () => {
    it('expands a single item', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const state = createSidebarState(items)

      await state.setExpanded('item1', true)

      expect(state.expandedItems.value).toEqual({ item1: true })
    })

    it('collapses a single item', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const state = createSidebarState(items)

      await state.setExpanded('item1', true)
      await state.setExpanded('item1', false)

      expect(state.expandedItems.value).toEqual({ item1: false })
    })

    it('expands nested item and all parents', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            {
              id: 'child',
              title: 'Child',
              children: [{ id: 'grandchild', title: 'Grandchild' }],
            },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setExpanded('grandchild', true)

      expect(state.expandedItems.value).toEqual({
        grandchild: true,
        child: true,
        root: true,
      })
    })

    it('collapsing an item does not collapse parents', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            {
              id: 'child',
              title: 'Child',
              children: [{ id: 'grandchild', title: 'Grandchild' }],
            },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setExpanded('grandchild', true)
      await state.setExpanded('grandchild', false)

      expect(state.expandedItems.value).toEqual({
        grandchild: false,
        child: true,
        root: true,
      })
    })

    it('handles expanding non-existent item', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const state = createSidebarState(items)

      await state.setExpanded('non-existent', true)

      expect(state.expandedItems.value).toEqual({})
    })

    it('handles deeply nested item expansion', async () => {
      const items: SidebarItem[] = [
        {
          id: 'level1',
          title: 'Level 1',
          children: [
            {
              id: 'level2',
              title: 'Level 2',
              children: [
                {
                  id: 'level3',
                  title: 'Level 3',
                  children: [
                    {
                      id: 'level4',
                      title: 'Level 4',
                      children: [{ id: 'level5', title: 'Level 5' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setExpanded('level5', true)

      expect(state.expandedItems.value).toEqual({
        level5: true,
        level4: true,
        level3: true,
        level2: true,
        level1: true,
      })
    })

    it('calls onBeforeExpand hook', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onBeforeExpand = vi.fn()
      const state = createSidebarState(items, {
        hooks: { onBeforeExpand },
      })

      await state.setExpanded('item1', true)

      expect(onBeforeExpand).toHaveBeenCalledWith('item1')
      expect(onBeforeExpand).toHaveBeenCalledTimes(1)
    })

    it('calls onAfterExpand hook', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onAfterExpand = vi.fn()
      const state = createSidebarState(items, {
        hooks: { onAfterExpand },
      })

      await state.setExpanded('item1', true)

      expect(onAfterExpand).toHaveBeenCalledWith('item1')
      expect(onAfterExpand).toHaveBeenCalledTimes(1)
    })

    it('calls hooks in correct order', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const callOrder: string[] = []

      const onBeforeExpand = vi.fn(() => {
        callOrder.push('before')
      })
      const onAfterExpand = vi.fn(() => {
        callOrder.push('after')
      })

      const state = createSidebarState(items, {
        hooks: { onBeforeExpand, onAfterExpand },
      })

      await state.setExpanded('item1', true)

      expect(callOrder).toEqual(['before', 'after'])
    })

    it('handles async hooks', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      let asyncValue = 'initial'

      const onBeforeExpand = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        asyncValue = 'before'
      })

      const onAfterExpand = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        asyncValue = 'after'
      })

      const state = createSidebarState(items, {
        hooks: { onBeforeExpand, onAfterExpand },
      })

      await state.setExpanded('item1', true)

      expect(asyncValue).toBe('after')
      expect(onBeforeExpand).toHaveBeenCalled()
      expect(onAfterExpand).toHaveBeenCalled()
    })

    it('calls hooks when collapsing', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onBeforeExpand = vi.fn()
      const onAfterExpand = vi.fn()

      const state = createSidebarState(items, {
        hooks: { onBeforeExpand, onAfterExpand },
      })

      await state.setExpanded('item1', false)

      expect(onBeforeExpand).toHaveBeenCalledWith('item1')
      expect(onAfterExpand).toHaveBeenCalledWith('item1')
    })

    it('maintains expanded state across multiple operations', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            { id: 'child1', title: 'Child 1' },
            { id: 'child2', title: 'Child 2' },
            { id: 'child3', title: 'Child 3' },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setExpanded('child1', true)
      await state.setExpanded('child2', true)
      await state.setExpanded('child1', false)

      expect(state.expandedItems.value).toEqual({
        child1: false,
        child2: true,
        root: true,
      })
    })
  })

  describe('combined operations', () => {
    it('handles selection and expansion independently', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            { id: 'child1', title: 'Child 1' },
            { id: 'child2', title: 'Child 2' },
          ],
        },
      ]
      const state = createSidebarState(items)

      await state.setSelected('child1')
      await state.setExpanded('child2', true)

      expect(state.selectedItems.value).toEqual({ child1: true, root: true })
      expect(state.expandedItems.value).toEqual({ child2: true, root: true })
    })

    it('handles multiple selections and expansions', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root1',
          title: 'Root 1',
          children: [{ id: 'child1', title: 'Child 1' }],
        },
        {
          id: 'root2',
          title: 'Root 2',
          children: [{ id: 'child2', title: 'Child 2' }],
        },
      ]
      const state = createSidebarState(items)

      await state.setExpanded('child1', true)
      await state.setExpanded('child2', true)
      await state.setSelected('child2')

      expect(state.selectedItems.value).toEqual({ child2: true, root2: true })
      expect(state.expandedItems.value).toEqual({
        child1: true,
        root1: true,
        child2: true,
        root2: true,
      })
    })

    it('allows selecting a collapsed item', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [{ id: 'child', title: 'Child' }],
        },
      ]
      const state = createSidebarState(items)

      await state.setExpanded('root', false)
      await state.setSelected('child')

      expect(state.expandedItems.value).toEqual({ root: false })
      expect(state.selectedItems.value).toEqual({ child: true, root: true })
    })
  })

  describe('edge cases', () => {
    it('handles empty string ids', async () => {
      const items: SidebarItem[] = [{ id: '', title: 'Empty ID' }]
      const state = createSidebarState(items)

      await state.setSelected('')

      expect(state.selectedItems.value).toEqual({ '': true })
    })

    it('handles items with special characters in ids', async () => {
      const items: SidebarItem[] = [
        { id: 'item-with-dashes', title: 'Item' },
        { id: 'item_with_underscores', title: 'Item' },
        { id: 'item.with.dots', title: 'Item' },
        { id: 'item/with/slashes', title: 'Item' },
      ]
      const state = createSidebarState(items)

      await state.setSelected('item-with-dashes')
      expect(state.selectedItems.value['item-with-dashes']).toBe(true)

      await state.setSelected('item_with_underscores')
      expect(state.selectedItems.value['item_with_underscores']).toBe(true)

      await state.setSelected('item.with.dots')
      expect(state.selectedItems.value['item.with.dots']).toBe(true)

      await state.setSelected('item/with/slashes')
      expect(state.selectedItems.value['item/with/slashes']).toBe(true)
    })

    it('handles very large tree structures', async () => {
      const items: SidebarItem[] = []

      // Create a tree with 100 parents, each with 10 children
      for (let i = 0; i < 100; i++) {
        const children: SidebarItem[] = []
        for (let j = 0; j < 10; j++) {
          children.push({
            id: `child-${i}-${j}`,
            title: `Child ${i}-${j}`,
          })
        }
        items.push({
          id: `parent-${i}`,
          title: `Parent ${i}`,
          children,
        })
      }

      const state = createSidebarState(items)

      await state.setSelected('child-50-5')
      expect(state.selectedItems.value['child-50-5']).toBe(true)
      expect(state.selectedItems.value['parent-50']).toBe(true)

      await state.setExpanded('child-99-9', true)
      expect(state.expandedItems.value['child-99-9']).toBe(true)
      expect(state.expandedItems.value['parent-99']).toBe(true)
    })

    it('handles rapid consecutive operations', async () => {
      const items: SidebarItem[] = [
        {
          id: 'root',
          title: 'Root',
          children: [
            { id: 'child1', title: 'Child 1' },
            { id: 'child2', title: 'Child 2' },
            { id: 'child3', title: 'Child 3' },
          ],
        },
      ]
      const state = createSidebarState(items)

      // Perform rapid operations
      await Promise.all([
        state.setSelected('child1'),
        state.setExpanded('child2', true),
        state.setExpanded('child3', true),
      ])

      // Final state should be consistent
      expect(state.index.size).toBe(4)
      expect(state.selectedItems.value['child1']).toBe(true)
    })

    it('handles all hooks provided', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onBeforeSelect = vi.fn()
      const onAfterSelect = vi.fn()
      const onBeforeExpand = vi.fn()
      const onAfterExpand = vi.fn()

      const state = createSidebarState(items, {
        hooks: {
          onBeforeSelect,
          onAfterSelect,
          onBeforeExpand,
          onAfterExpand,
        },
      })

      await state.setSelected('item1')
      await state.setExpanded('item1', true)

      expect(onBeforeSelect).toHaveBeenCalledTimes(1)
      expect(onAfterSelect).toHaveBeenCalledTimes(1)
      expect(onBeforeExpand).toHaveBeenCalledTimes(1)
      expect(onAfterExpand).toHaveBeenCalledTimes(1)
    })

    it('handles partial hooks configuration', async () => {
      const items: SidebarItem[] = [{ id: 'item1', title: 'Item 1' }]
      const onBeforeSelect = vi.fn()

      const state = createSidebarState(items, {
        hooks: { onBeforeSelect },
      })

      await state.setSelected('item1')

      expect(onBeforeSelect).toHaveBeenCalledTimes(1)
      expect(state.selectedItems.value).toEqual({ item1: true })
    })
  })
})
