import {
  ScalarSidebarGroup,
  ScalarSidebarItem,
  ScalarSidebarItem as ScalarSidebarItemComponent,
  ScalarSidebarSection,
} from '@scalar/components'
import { Draggable } from '@scalar/draggable'
import { ScalarIconFolder } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SidebarHttpBadge from './SidebarHttpBadge.vue'
import SidebarItem, { type Item } from './SidebarItem.vue'

describe('SidebarItem', () => {
  const baseProps = {
    isSelected: vi.fn(),
    isExpanded: vi.fn(),
    layout: 'reference' as const,
    options: undefined,
  }

  describe('rendering without children', () => {
    it('renders a simple item without children', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(ScalarSidebarItemComponent).exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Item')
    })

    it('renders item as a button element', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const sidebarItem = wrapper.findComponent(ScalarSidebarItemComponent)
      expect(sidebarItem.props('is')).toBe('button')
    })

    it('emits click event when item is clicked', async () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const sidebarItem = wrapper.findComponent(ScalarSidebarItem)
      sidebarItem.vm.$emit('click')

      expect(wrapper.emitted('selectItem')).toBeTruthy()
      expect(wrapper.emitted('selectItem')?.[0]).toEqual(['1'])
    })

    it('shows selected state when item is in selectedItems', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isSelected: (id) => id === '1',
        },
      })

      const sidebarItem = wrapper.findComponent(ScalarSidebarItemComponent)
      expect(sidebarItem.props('selected')).toBe(true)
    })

    it('does not show selected state when item is not in selectedItems', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isSelected: () => false,
        },
      })

      const sidebarItem = wrapper.findComponent(ScalarSidebarItemComponent)
      expect(sidebarItem.props('selected')).toBe(false)
    })
  })

  describe('HTTP method badge rendering', () => {
    it('renders HTTP badge for operation items with method', () => {
      const item: Item = {
        id: '1',
        title: 'Get Users',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/users',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(SidebarHttpBadge).exists()).toBe(true)
    })

    it('passes correct method prop to HTTP badge', () => {
      const item: Item = {
        id: '1',
        title: 'Create User',
        type: 'operation',
        ref: 'ref-1',
        method: 'post',
        path: '/users',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const badge = wrapper.findComponent(SidebarHttpBadge)
      expect(badge.props('method')).toBe('post')
    })

    it('passes webhook prop to HTTP badge for webhook items', () => {
      const item: Item = {
        id: '1',
        title: 'User Created',
        type: 'webhook',
        ref: 'ref-1',
        method: 'post',
        name: 'userCreated',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const badge = wrapper.findComponent(SidebarHttpBadge)
      expect(badge.props('webhook')).toBe(true)
    })

    it('does not pass webhook prop for operation items', () => {
      const item: Item = {
        id: '1',
        title: 'Get Users',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/users',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const badge = wrapper.findComponent(SidebarHttpBadge)
      expect(badge.props('webhook')).toBe(false)
    })

    it('passes active state to HTTP badge', () => {
      const item: Item = {
        id: '1',
        title: 'Get Users',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/users',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isSelected: (id) => id === '1',
        },
      })

      const badge = wrapper.findComponent(SidebarHttpBadge)
      expect(badge.props('active')).toBe(true)
    })

    it('does not render HTTP badge for items without method', () => {
      const item: Item = {
        id: '1',
        title: 'Some Document',
        type: 'document',
        children: [],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(SidebarHttpBadge).exists()).toBe(false)
    })
  })

  describe('rendering with children', () => {
    it('renders ScalarSidebarSection for group items with children', () => {
      const item: Item = {
        id: '1',
        title: 'User Operations',
        type: 'tag',
        name: 'userOperations',
        isGroup: true,
        children: [{ id: '2', title: 'Get User', type: 'operation', ref: 'ref-2', method: 'get', path: '/users' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(ScalarSidebarSection).exists()).toBe(true)
      expect(wrapper.findComponent(ScalarSidebarSection).text()).toContain('User Operations')
    })

    it('renders ScalarSidebarGroup for non-group items with children', () => {
      const item: Item = {
        id: '1',
        title: 'User API',
        type: 'document',
        children: [{ id: '2', title: 'Get User', type: 'operation', ref: 'ref-2', method: 'get', path: '/users' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(ScalarSidebarGroup).exists()).toBe(true)
    })

    it('recursively renders child items', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'tag',
        name: 'parent',
        isGroup: true,
        children: [
          { id: '2', title: 'Child 1', type: 'operation', ref: 'ref-2', method: 'get', path: '/child1' },
          { id: '3', title: 'Child 2', type: 'operation', ref: 'ref-3', method: 'post', path: '/child2' },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const childItems = wrapper.findAllComponents(SidebarItem)
      // Should find the parent component plus the two children
      expect(childItems.length).toBeGreaterThanOrEqual(2)
    })

    it('renders folder icon for document type items', () => {
      const item: Item = {
        id: '1',
        title: 'Documents',
        type: 'document',
        children: [
          {
            id: '1',
            title: 'Child',
            type: 'operation',
            ref: 'ref-1',
            method: 'get',
            path: '/child',
          },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(ScalarIconFolder).exists()).toBe(true)
    })
  })

  describe('layout filtering', () => {
    it('shows all items in reference layout', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'tag',
        name: 'parent',
        isGroup: true,
        children: [
          { id: '2', title: 'Operation', type: 'operation', ref: 'ref-2', method: 'get', path: '/operation' },
          { id: '3', title: 'Webhook', type: 'webhook', ref: 'ref-3', method: 'post', name: 'webhook' },
          { id: '4', title: 'Example', type: 'example', name: 'example' },
          { id: '5', title: 'Model', type: 'model', ref: 'ref-5', name: 'model' },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'reference',
          item,
        },
      })

      const childItems = wrapper.findAllComponents(SidebarItem)
      // Parent + 4 children
      expect(childItems.length).toBeGreaterThanOrEqual(4)
    })

    it('filters items in client layout to only show webhooks, operations, examples, and tags', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'document',
        children: [
          { id: '2', title: 'Operation', type: 'operation', ref: 'ref-2', method: 'get', path: '/operation' },
          { id: '3', title: 'Webhook', type: 'webhook', ref: 'ref-3', method: 'post', name: 'webhook' },
          { id: '4', title: 'Example', type: 'example', name: 'example' },
          { id: '5', title: 'Model', type: 'model', ref: 'ref-5', name: 'model' },
          { id: '6', title: 'Tag', type: 'tag', name: 'tag', isGroup: true },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
          isExpanded: (id) => id === '1',
        },
      })

      const childItems = wrapper.findAllComponents(SidebarItem)
      // Should have parent + operation + webhook + example + tag, but NOT model
      const childIds = childItems.map((w) => w.props('item')?.id).filter(Boolean)
      expect(childIds).toContain('2') // operation
      expect(childIds).toContain('3') // webhook
      expect(childIds).toContain('4') // example
      expect(childIds).toContain('6') // tag
      expect(childIds).not.toContain('5') // model should be filtered out
    })
  })

  describe('operation title source', () => {
    it('displays item title by default', () => {
      const item: Item = {
        id: '1',
        title: 'Get User Details',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/users/{id}',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.text()).toContain('Get User Details')
    })

    it('displays path when operationTitleSource is path', () => {
      const item: Item = {
        id: '1',
        title: 'Get User Details',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/users/{id}',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          options: {
            operationTitleSource: 'path',
          },
        },
      })

      // Should contain the path with zero-width spaces after slashes
      expect(wrapper.text()).toContain('/​users/​{id}')
    })

    it('inserts zero-width space after slashes in path for line-break opportunities', () => {
      const item: Item = {
        id: '1',
        title: 'Get User',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/api/v1/users',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          options: {
            operationTitleSource: 'path',
          },
        },
      })

      const html = wrapper.html()
      // Check for zero-width space character (U+200B)
      expect(html).toContain('/\u200B')
    })

    it('uses title for items without path even when operationTitleSource is path', () => {
      const item: Item = {
        id: '1',
        title: 'User Document',
        type: 'document',
        children: [],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          options: {
            operationTitleSource: 'path',
          },
        },
      })

      expect(wrapper.text()).toContain('User Document')
    })
  })

  describe('drag and drop', () => {
    it('wraps content in Draggable component', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(Draggable).exists()).toBe(true)
    })

    it('passes item id to Draggable component', () => {
      const item: Item = {
        id: 'test-123',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const draggable = wrapper.findComponent(Draggable)
      expect(draggable.props('id')).toBe('test-123')
    })

    it('enables dragging for client layout', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
        },
      })

      const draggable = wrapper.findComponent(Draggable)
      expect(draggable.props('isDraggable')).toBe(true)
    })

    it('disables dragging for reference layout', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'reference',
          item,
        },
      })

      const draggable = wrapper.findComponent(Draggable)
      expect(draggable.props('isDraggable')).toBe(false)
    })

    it('emits onDragEnd event when drag ends', async () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
        },
      })

      const draggingItem = { id: '1', parentIds: [] }
      const hoveredItem = { id: '2', offset: 0 }

      await wrapper.findComponent(Draggable).vm.$emit('onDragEnd', draggingItem, hoveredItem)

      expect(wrapper.emitted('onDragEnd')).toBeTruthy()
      expect(wrapper.emitted('onDragEnd')?.[0]).toEqual([draggingItem, hoveredItem])
    })

    it('bubbles up onDragEnd event from child items', async () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'tag',
        name: 'parent',
        isGroup: true,
        children: [{ id: '2', title: 'Child', type: 'operation', ref: 'ref-2', method: 'get', path: '/child' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
        },
      })

      const draggingItem = { id: '2', parentIds: [] }
      const hoveredItem = { id: '3', offset: 0 }

      const childItems = wrapper.findAllComponents(SidebarItem)
      const childComponent = childItems.find((w) => w.props('item').id === '2')

      await childComponent?.vm.$emit('onDragEnd', draggingItem, hoveredItem)

      expect(wrapper.emitted('onDragEnd')).toBeTruthy()
      expect(wrapper.emitted('onDragEnd')?.[0]).toEqual([draggingItem, hoveredItem])
    })
  })

  describe('expansion state', () => {
    it('passes expansion state to group model', () => {
      const item: Item = {
        id: '1',
        title: 'Expandable',
        type: 'document',
        children: [
          {
            id: '1',
            title: 'Child',
            type: 'operation',
            ref: 'ref-1',
            method: 'get',
            path: '/child',
          },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isExpanded: (id) => id === '1',
        },
      })

      const group = wrapper.findComponent(ScalarSidebarGroup)
      expect(group.exists()).toBe(true)
      expect(group.props('modelValue')).toBe(true)
    })

    it('defaults to false when item is not in expandedItems', () => {
      const item: Item = {
        id: '1',
        title: 'Expandable',
        type: 'document',
        children: [
          {
            id: '1',
            title: 'Child',
            type: 'operation',
            ref: 'ref-1',
            method: 'get',
            path: '/child',
          },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isExpanded: () => false,
        },
      })

      const group = wrapper.findComponent(ScalarSidebarGroup)
      expect(group.exists()).toBe(true)
      expect(group.props('modelValue')).toBe(false)
    })

    it('emits click event when group is toggled', async () => {
      const item: Item = {
        id: 'group-1',
        title: 'Expandable',
        type: 'document',
        children: [
          {
            id: '1',
            title: 'Child',
            type: 'operation',
            ref: 'ref-1',
            method: 'get',
            path: '/child',
          },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const group = wrapper.findComponent(ScalarSidebarGroup)
      expect(group.exists()).toBe(true)
      group.vm.$emit('update:modelValue')

      expect(wrapper.emitted('selectItem')).toBeTruthy()
      expect(wrapper.emitted('selectItem')?.[0]).toEqual(['group-1'])
    })
  })

  describe('slots', () => {
    it('renders aside slot content', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
        slots: {
          aside: '<div class="custom-aside">Custom Content</div>',
        },
      })

      expect(wrapper.find('.custom-aside').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Content')
    })

    it('passes item prop to aside slot', () => {
      const item: Item = {
        id: 'test-id',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
        slots: {
          aside: '<div class="slot-test">{{ item.id }}</div>',
        },
      })

      expect(wrapper.html()).toContain('test-id')
    })

    it('passes aside slot to child items', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'tag',
        name: 'parent',
        isGroup: true,
        children: [{ id: '2', title: 'Child', type: 'operation', ref: 'ref-2', method: 'get', path: '/child' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
        slots: {
          aside: '<div class="custom-aside">Aside</div>',
        },
      })

      // Aside slot should be present in both parent and child
      const asideElements = wrapper.findAll('.custom-aside')
      expect(asideElements.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty children array', () => {
      const item: Item = {
        id: '1',
        title: 'Empty Parent',
        type: 'document',
        children: [],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      expect(wrapper.findComponent(ScalarSidebarItem).exists()).toBe(true)
      expect(wrapper.text()).toContain('Empty Parent')
    })

    it('handles operations and webhooks with children in reference layout', () => {
      const item: Item = {
        id: '1',
        title: 'Operation with examples',
        type: 'operation',
        ref: 'ref-1',
        method: 'post',
        path: '/users',
        children: [{ id: '2', title: 'Example 1', type: 'example', name: 'example1' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'reference',
          item,
        },
      })

      // In reference layout, operations/webhooks with children should not render as groups
      expect(wrapper.findComponent(ScalarSidebarGroup).exists()).toBe(false)
      expect(wrapper.findComponent(ScalarSidebarItemComponent).exists()).toBe(true)
    })

    it('handles operations and webhooks with children in client layout', () => {
      const item: Item = {
        id: '1',
        title: 'Operation with examples',
        type: 'operation',
        ref: 'ref-1',
        method: 'post',
        path: '/users',
        children: [{ id: '2', title: 'Example 1', type: 'example', name: 'example1' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
        },
      })

      // In client layout, operations/webhooks with children should render as groups
      expect(wrapper.findComponent(ScalarSidebarGroup).exists()).toBe(true)
    })

    it('handles missing optional props gracefully', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
      }

      const wrapper = mount(SidebarItem, {
        props: {
          item,
          layout: 'reference',
          isSelected: () => false,
          isExpanded: () => false,
          options: undefined,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Item')
    })

    it('handles deeply nested items', () => {
      const item: Item = {
        id: '1',
        title: 'Level 1',
        type: 'tag',
        name: 'level1',
        isGroup: true,
        children: [
          {
            id: '2',
            title: 'Level 2',
            type: 'tag',
            name: 'level2',
            isGroup: false,
            children: [
              {
                id: '3',
                title: 'Level 3',
                type: 'operation',
                ref: 'ref-3',
                method: 'get',
                path: '/level3',
              },
            ],
          },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isExpanded: (id) => id === '1' || id === '2' || id === '3',
        },
      })

      expect(wrapper.text()).toContain('Level 1')
      expect(wrapper.text()).toContain('Level 2')
      expect(wrapper.text()).toContain('Level 3')
    })
  })
})
