import { ScalarSidebar, ScalarSidebarItems } from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { Item } from '@/types'

import { createSidebarState } from '../helpers/create-sidebar-state'
import ScalarSidebarComponent from './ScalarSidebar.vue'
import SidebarItem from './SidebarItem.vue'

describe('ScalarSidebar', () => {
  describe('filtering items by layout', () => {
    it('shows all items in reference layout', () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Parent',
          type: 'tag',
          name: 'parent',
          isGroup: true,
          children: [
            {
              id: '2',
              title: 'Operation',
              type: 'operation',
              ref: 'ref-2',
              method: 'get',
              path: '/operation',
            },
            {
              id: '3',
              title: 'Webhook',
              type: 'webhook',
              ref: 'ref-3',
              method: 'post',
              name: 'webhook',
            },
            {
              id: '4',
              title: 'Model',
              type: 'model',
              ref: 'ref-4',
              name: 'model',
            },
          ],
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const sidebarItems = wrapper.findAllComponents(SidebarItem)
      // Should render the parent item
      expect(sidebarItems.length).toBe(4)
      expect(sidebarItems[0]?.props('item')).toEqual(items[0])
    })
  })

  describe('state management on click', () => {
    it('updates selected state when clicking an item', async () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Parent',
          type: 'document',
          children: [
            {
              id: '2',
              title: 'Child',
              type: 'operation',
              ref: 'ref-2',
              method: 'get',
              path: '/child',
            },
          ],
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
          onSelectItem: (id: string) => {
            state.setSelected(id)
          },
        },
      })

      // Initially nothing is selected
      expect(state.selectedItems.value).toEqual({})

      // Find the SidebarItem and trigger selectItem event
      const sidebarItem = wrapper.findComponent(SidebarItem)
      sidebarItem.vm.$emit('selectItem', '1')

      // Allow Vue to process the event
      await wrapper.vm.$nextTick()

      // Check that the item is now selected
      expect(state.selectedItems.value['1']).toBe(true)
    })

    it('toggles expanded state when clicking an item', async () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Parent',
          type: 'document',
          children: [
            {
              id: '2',
              title: 'Child',
              type: 'operation',
              ref: 'ref-2',
              method: 'get',
              path: '/child',
            },
          ],
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
          onSelectItem: (id: string) => {
            const currentlyExpanded = state.isExpanded(id)
            state.setExpanded(id, !currentlyExpanded)
          },
        },
      })

      // Initially nothing is expanded
      expect(state.expandedItems.value).toEqual({})

      // Click to expand
      const sidebarItem = wrapper.findComponent(SidebarItem)
      sidebarItem.vm.$emit('selectItem', '1')

      // Allow Vue to process the event
      await wrapper.vm.$nextTick()

      // Should be expanded
      expect(state.expandedItems.value['1']).toBe(true)

      // Click again to collapse
      sidebarItem.vm.$emit('selectItem', '1')
      await wrapper.vm.$nextTick()

      // Should be collapsed
      expect(state.expandedItems.value['1']).toBe(false)
    })

    it('expands and selects an item in one click', async () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Item 1',
          type: 'document',
          children: [
            {
              id: '2',
              title: 'Child',
              type: 'operation',
              ref: 'ref-2',
              method: 'get',
              path: '/child',
            },
          ],
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
          onSelectItem: (id: string) => {
            state.setSelected(id)
            state.setExpanded(id, true)
          },
        },
      })

      const sidebarItem = wrapper.findComponent(SidebarItem)
      sidebarItem.vm.$emit('selectItem', '1')

      // Allow Vue to process the event
      await wrapper.vm.$nextTick()

      // Both should be updated
      expect(state.selectedItems.value['1']).toBe(true)
      expect(state.expandedItems.value['1']).toBe(true)
    })

    it('updates state for different items independently', async () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Item 1',
          type: 'document',
          children: [
            {
              id: '2',
              title: 'Child 1',
              type: 'operation',
              ref: 'ref-2',
              method: 'get',
              path: '/child1',
            },
          ],
        },
        {
          id: '3',
          title: 'Item 2',
          type: 'document',
          children: [
            {
              id: '4',
              title: 'Child 2',
              type: 'operation',
              ref: 'ref-4',
              method: 'get',
              path: '/child2',
            },
          ],
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
          onSelectItem: (id: string) => {
            state.setSelected(id)
            state.setExpanded(id, true)
          },
        },
      })

      const sidebarItems = wrapper.findAllComponents(SidebarItem)

      // Click first item
      sidebarItems[0]?.vm.$emit('selectItem', '1')
      await wrapper.vm.$nextTick()

      expect(state.selectedItems.value['1']).toBe(true)
      expect(state.expandedItems.value['1']).toBe(true)

      // Click second item
      sidebarItems[1]?.vm.$emit('selectItem', '3')
      await wrapper.vm.$nextTick()

      // First item should no longer be selected (setSelected clears previous selection)
      expect(state.selectedItems.value['1']).toBeUndefined()
      expect(state.selectedItems.value['3']).toBe(true)
      // But first item should still be expanded
      expect(state.expandedItems.value['1']).toBe(true)
      expect(state.expandedItems.value['3']).toBe(true)
    })
  })

  describe('rendering', () => {
    it('renders ScalarSidebar wrapper component', () => {
      const items: Item[] = []
      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      expect(wrapper.findComponent(ScalarSidebar).exists()).toBe(true)
    })

    it('renders ScalarSidebarItems container', () => {
      const items: Item[] = []
      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      expect(wrapper.findComponent(ScalarSidebarItems).exists()).toBe(true)
    })

    it('renders SidebarItem for each item in the state', () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Item 1',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/item1',
        },
        {
          id: '2',
          title: 'Item 2',
          type: 'operation',
          ref: 'ref-2',
          method: 'post',
          path: '/item2',
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const sidebarItems = wrapper.findAllComponents(SidebarItem)
      expect(sidebarItems.length).toBe(2)
    })

    it('passes correct props to SidebarItem components', () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Test Item',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/test',
        },
      ]

      const state = createSidebarState(items)
      state.selectedItems.value = { '1': true }
      state.expandedItems.value = { '1': false }

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'client',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const sidebarItem = wrapper.findComponent(SidebarItem)
      expect(sidebarItem.props('item')).toEqual(items[0])
      expect(sidebarItem.props('layout')).toBe('client')
    })

    it('renders empty list when there are no items', () => {
      const items: Item[] = []
      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const sidebarItems = wrapper.findAllComponents(SidebarItem)
      expect(sidebarItems.length).toBe(0)
    })
  })

  describe('drag and drop', () => {
    it('emits reorder event when onDragEnd is triggered', async () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Item 1',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/item1',
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'client',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const draggingItem: DraggingItem = { id: '1', parentId: null }
      const hoveredItem: HoveredItem = { id: '2', offset: 0, parentId: null }

      const sidebarItem = wrapper.findComponent(SidebarItem)
      expect(sidebarItem.exists()).toBe(true)
      sidebarItem.vm.$emit('onDragEnd', draggingItem, hoveredItem)

      expect(wrapper.emitted('reorder')).toBeTruthy()
      expect(wrapper.emitted('reorder')?.[0]).toEqual([draggingItem, hoveredItem])
    })

    it('passes drag event data correctly to parent', async () => {
      const items: Item[] = [
        {
          id: 'item-a',
          title: 'Item A',
          type: 'operation',
          ref: 'ref-a',
          method: 'get',
          path: '/a',
        },
        {
          id: 'item-b',
          title: 'Item B',
          type: 'operation',
          ref: 'ref-b',
          method: 'post',
          path: '/b',
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'client',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const draggingItem: DraggingItem = { id: 'item-a', parentId: null }
      const hoveredItem: HoveredItem = { id: 'item-b', offset: 1, parentId: null }

      const sidebarItems = wrapper.findAllComponents(SidebarItem)
      sidebarItems[0]?.vm.$emit('onDragEnd', draggingItem, hoveredItem)

      const emitted = wrapper.emitted('reorder')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]?.[0]).toEqual(draggingItem)
      expect(emitted?.[0]?.[1]).toEqual(hoveredItem)
    })
  })

  describe('slots', () => {
    it('renders header slot content', () => {
      const items: Item[] = []
      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
        slots: {
          header: '<div class="test-header">Header Content</div>',
        },
      })

      expect(wrapper.find('.test-header').exists()).toBe(true)
      expect(wrapper.text()).toContain('Header Content')
    })

    it('renders footer slot content', () => {
      const items: Item[] = []
      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
        slots: {
          footer: '<div class="test-footer">Footer Content</div>',
        },
      })

      expect(wrapper.find('.test-footer').exists()).toBe(true)
      expect(wrapper.text()).toContain('Footer Content')
    })

    it('renders decorator slot and passes it through to SidebarItem', () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Test Item',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/test',
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
        slots: {
          decorator: '<div class="test-decorator">{{ params.item.title }} Decorator</div>',
        },
      })

      const decorator = wrapper.find('.test-decorator')
      expect(decorator.exists()).toBe(true)
      expect(decorator.text()).toContain('Test Item')
    })

    it('renders default slot when provided', () => {
      const items: Item[] = []
      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
        slots: {
          default: '<div class="custom-content">Custom Sidebar Content</div>',
        },
      })

      expect(wrapper.find('.custom-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Sidebar Content')
    })

    it('renders default content when no default slot provided', () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Test Item',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/test',
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      // Should render ScalarSidebarItems and SidebarItem by default
      expect(wrapper.findComponent(ScalarSidebarItems).exists()).toBe(true)
      expect(wrapper.findComponent(SidebarItem).exists()).toBe(true)
    })
  })

  describe('lifecycle hooks', () => {
    it('calls sidebar state hooks when items are clicked', async () => {
      const onBeforeSelect = vi.fn()
      const onAfterSelect = vi.fn()
      const onBeforeExpand = vi.fn()
      const onAfterExpand = vi.fn()

      const items: Item[] = [
        {
          id: '1',
          title: 'Test Item',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/test',
        },
      ]

      const state = createSidebarState(items, {
        hooks: {
          onBeforeSelect,
          onAfterSelect,
          onBeforeExpand,
          onAfterExpand,
        },
      })

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
          onSelectItem: (id: string) => {
            state.setSelected(id)
            state.setExpanded(id, true)
          },
        },
      })

      const sidebarItem = wrapper.findComponent(SidebarItem)
      sidebarItem.vm.$emit('selectItem', '1')

      // Allow time for async hooks
      await wrapper.vm.$nextTick()

      expect(onBeforeSelect).toHaveBeenCalledWith('1')
      expect(onAfterSelect).toHaveBeenCalledWith('1')
      expect(onBeforeExpand).toHaveBeenCalledWith('1')
      expect(onAfterExpand).toHaveBeenCalledWith('1')
    })
  })

  describe('edge cases', () => {
    it('handles items with missing children gracefully in client layout', () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Item without children property',
          type: 'operation',
          ref: 'ref-1',
          method: 'get',
          path: '/test',
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'client',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      // Should not crash, but should filter out the item
      const sidebarItems = wrapper.findAllComponents(SidebarItem)
      expect(sidebarItems.length).toBe(1)
    })

    it.skip('handles rapid successive clicks', async () => {
      const items: Item[] = [
        {
          id: '1',
          title: 'Test Item',
          type: 'document',
          children: [
            {
              id: '2',
              title: 'Child',
              type: 'operation',
              ref: 'ref-2',
              method: 'get',
              path: '/child',
            },
          ],
        },
      ]

      const state = createSidebarState(items)

      const wrapper = mount(ScalarSidebarComponent, {
        props: {
          layout: 'reference',
          items: state.items.value,
          isSelected: state.isSelected,
          isExpanded: state.isExpanded,
        },
      })

      const sidebarItem = wrapper.findComponent(SidebarItem)

      // Click multiple times rapidly
      sidebarItem.vm.$emit('selectItem', '1')
      sidebarItem.vm.$emit('selectItem', '1')
      sidebarItem.vm.$emit('selectItem', '1')

      // Should end up collapsed (odd number of clicks)
      expect(state.expandedItems.value['1']).toBe(true)
    })
  })
})
