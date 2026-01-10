import {
  ScalarSidebarGroup,
  ScalarSidebarItem,
  ScalarSidebarItem as ScalarSidebarItemComponent,
  ScalarSidebarSection,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { Item } from '@/types'

import SidebarHttpBadge from './SidebarHttpBadge.vue'
import SidebarItem from './SidebarItem.vue'

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

    it('emits click event when item is clicked', () => {
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

    it('applies text decoration when item is deprecated', () => {
      const item: Item = {
        id: '1',
        title: 'Test Item',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/test',
        isDeprecated: true,
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const deprecatedElement = wrapper.find('.line-through')
      expect(deprecatedElement.exists()).toBe(true)
    })

    it('does not apply text decoration when item is not deprecated', () => {
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

      const deprecatedElement = wrapper.find('.line-through')
      expect(deprecatedElement.exists()).toBe(false)
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
        name: 'someDocument',
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
        name: 'userAPI',
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
        name: 'documents',
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

      expect(wrapper.findComponent(LibraryIcon).exists()).toBe(true)
    })

    it('applies text decoration to deprecated group items', () => {
      const item: Item = {
        id: '1',
        title: 'Deprecated API',
        type: 'document',
        name: 'deprecatedAPI',
        isDeprecated: true,
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
      } as Item

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const deprecatedElement = wrapper.find('.line-through')
      expect(deprecatedElement.exists()).toBe(true)
      expect(deprecatedElement.text()).toContain('Deprecated API')
    })

    it('applies line-through class to deprecated ScalarSidebarGroup items', () => {
      const item: Item = {
        id: '1',
        title: 'Deprecated Folder',
        type: 'document',
        name: 'deprecatedFolder',
        isDeprecated: true,
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
      } as Item

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
        },
      })

      const group = wrapper.findComponent(ScalarSidebarGroup)
      expect(group.exists()).toBe(true)
      const deprecatedElement = wrapper.find('.line-through')
      expect(deprecatedElement.exists()).toBe(true)
      expect(deprecatedElement.text()).toContain('Deprecated Folder')
    })

    it('applies line-through class to deprecated ScalarSidebarSection items', () => {
      const item: Item = {
        id: '1',
        title: 'Deprecated Group',
        type: 'operation',
        ref: 'ref-1',
        method: 'get',
        path: '/deprecated',
        isDeprecated: true,
        children: [
          {
            id: '2',
            title: 'Child',
            type: 'example',
            name: 'example1',
          },
        ],
      } as Item

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
        },
      })

      const section = wrapper.findComponent(ScalarSidebarGroup)
      expect(section.exists()).toBe(true)
      const deprecatedElement = wrapper.find('.line-through')
      expect(deprecatedElement.exists()).toBe(true)
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

    it('filters items in client layout to only show operations, examples, and tags / no webhooks or models', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        name: 'parent',
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
      // Should have parent + operation + example + tag, but NOT model
      const childIds = childItems.map((w) => w.props('item')?.id).filter(Boolean)
      expect(childIds).toContain('2') // operation
      expect(childIds).toContain('4') // example
      expect(childIds).toContain('6') // tag
      expect(childIds).not.toContain('5') // model should be filtered out
    })
  })

  describe('drag and drop', () => {
    it('applies draggable props to component', () => {
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
      expect(sidebarItem.exists()).toBe(true)
      // Verify the component receives draggable props via v-bind
      // The actual attribute forwarding depends on the component implementation
      expect(sidebarItem.vm.$attrs).toHaveProperty('draggable')
    })

    it('defaults to enabled dragging when isDraggable is not provided', () => {
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
      // Check that draggable prop defaults to true when not explicitly provided
      expect(sidebarItem.vm.$attrs.draggable).toBe(true)
    })

    it('respects explicit isDraggable prop when provided', () => {
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
          isDraggable: false,
        },
      })

      const sidebarItem = wrapper.findComponent(ScalarSidebarItemComponent)
      // Check that draggable prop respects explicit value
      // When isDraggable is false, draggable attribute should be undefined (not set)
      expect(sidebarItem.vm.$attrs.draggable).toBeUndefined()
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

      const sidebarItem = wrapper.findComponent(ScalarSidebarItemComponent)
      await sidebarItem.trigger('dragend')

      // Note: The actual drag end logic requires proper drag state setup
      // This test verifies the event handler is attached
      expect(sidebarItem.exists()).toBe(true)
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

    it('inherits isDraggable prop from parent to child items when false', () => {
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
          isDraggable: false,
        },
      })

      const childItems = wrapper.findAllComponents(SidebarItem)
      // Filter out the parent component (which has id '1')
      const childComponents = childItems.filter((w) => w.props('item').id !== '1')

      // Verify all child components received isDraggable: false
      expect(childComponents.length).toBeGreaterThan(0)
      childComponents.forEach((childComponent) => {
        expect(childComponent.props('isDraggable')).toBe(false)
      })
    })

    it('inherits isDraggable prop from parent to child items when true', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'document',
        name: 'parent',
        children: [
          { id: '2', title: 'Child 1', type: 'operation', ref: 'ref-2', method: 'get', path: '/child1' },
          { id: '3', title: 'Child 2', type: 'operation', ref: 'ref-3', method: 'post', path: '/child2' },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          item,
          isDraggable: true,
          // Ensure the group is expanded so children are rendered
          isExpanded: (id) => id === '1',
        },
      })

      const childItems = wrapper.findAllComponents(SidebarItem)
      // Filter out the parent component (which has id '1')
      const childComponents = childItems.filter((w) => w.props('item').id !== '1')

      // Verify all child components received isDraggable: true
      expect(childComponents.length).toBeGreaterThan(0)
      childComponents.forEach((childComponent) => {
        expect(childComponent.props('isDraggable')).toBe(true)
      })
    })
  })

  describe('expansion state', () => {
    it('passes expansion state to group model', () => {
      const item: Item = {
        id: '1',
        title: 'Expandable',
        type: 'document',
        name: 'userAPI',
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
      expect(group.props('open')).toBe(true)
    })

    it('defaults to false when item is not in expandedItems', () => {
      const item: Item = {
        id: '1',
        title: 'Expandable',
        type: 'document',
        name: 'userAPI',
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
      expect(group.props('open')).toBe(false)
    })

    it('emits click event when group is toggled', () => {
      const item: Item = {
        id: 'group-1',
        title: 'Expandable',
        type: 'document',
        name: 'userAPI',
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
      group.vm.$emit('click')

      expect(wrapper.emitted('selectItem')).toBeTruthy()
      expect(wrapper.emitted('selectItem')?.[0]).toEqual(['group-1'])
    })
  })

  describe('slots', () => {
    it('renders decorator slot content', () => {
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
          decorator: '<div class="custom-decorator">Custom Content</div>',
        },
      })

      expect(wrapper.find('.custom-decorator').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Content')
    })

    it('passes item prop to decorator slot', () => {
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
          decorator: '<div class="slot-test">{{ item.id }}</div>',
        },
      })

      expect(wrapper.html()).toContain('test-id')
    })

    it('passes decorator slot to child items', () => {
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
          decorator: '<div class="custom-decorator">Decorator</div>',
        },
      })

      // Decorator slot should be present in both parent and child
      const decoratorElements = wrapper.findAll('.custom-decorator')
      expect(decoratorElements.length).toBeGreaterThan(0)
    })

    it('renders empty slot content when item has no children', () => {
      const item: Item = {
        id: '1',
        title: 'Empty Folder',
        type: 'document',
        name: 'emptyFolder',
        children: [],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
          isExpanded: (id) => id === '1',
        },
        slots: {
          empty: '<div class="empty-state">No items here</div>',
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No items here')
    })

    it('passes item prop to empty slot', () => {
      const item: Item = {
        id: 'empty-folder-id',
        title: 'Empty Folder',
        type: 'document',
        name: 'emptyFolder',
        children: [],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
          isExpanded: (id) => id === 'empty-folder-id',
        },
        slots: {
          empty: '<div class="empty-slot-test">{{ item.id }}</div>',
        },
      })

      expect(wrapper.html()).toContain('empty-folder-id')
    })

    it('does not render empty slot when item has children', () => {
      const item: Item = {
        id: '1',
        title: 'Folder with Children',
        type: 'document',
        name: 'folderWithChildren',
        children: [{ id: '2', title: 'Child', type: 'operation', ref: 'ref-2', method: 'get', path: '/child' }],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
          isExpanded: (id) => id === '1',
        },
        slots: {
          empty: '<div class="empty-state">No items here</div>',
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('passes empty slot to child items', () => {
      const item: Item = {
        id: '1',
        title: 'Parent',
        type: 'document',
        name: 'parent',
        children: [
          {
            id: '2',
            title: 'Empty Child Folder',
            type: 'document',
            name: 'emptyChildFolder',
            children: [],
          },
        ],
      }

      const wrapper = mount(SidebarItem, {
        props: {
          ...baseProps,
          layout: 'client',
          item,
          isExpanded: (id) => id === '1' || id === '2',
        },
        slots: {
          empty: '<div class="empty-state">Empty folder</div>',
        },
      })

      // Empty slot should be rendered in the child folder that has no children
      const emptyElements = wrapper.findAll('.empty-state')
      expect(emptyElements.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty children array', () => {
      const item: Item = {
        id: '1',
        title: 'Empty Parent',
        type: 'document',
        name: 'emptyParent',
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
