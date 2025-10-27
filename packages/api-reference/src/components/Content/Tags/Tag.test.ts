import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Tag from './Tag.vue'

describe('Tag', () => {
  const mockTag: TraversedTag = {
    type: 'tag',
    id: 'test-tag',
    title: 'Test Tag',
    children: [],
    name: 'test-tag',
    description: 'A test tag description',
    isGroup: false,
  }

  describe('layout rendering', () => {
    it('renders ClassicLayout when layout is classic', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'classic',
          moreThanOneTag: true,
          isLoading: false,
          isCollapsed: false,
          onShowMore: undefined,
        },
      })

      // Check that ClassicLayout component is rendered
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(false)
    })

    it('renders ModernLayout when layout is modern', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'modern',
          moreThanOneTag: true,
          isCollapsed: false,
          isLoading: false,
          onShowMore: undefined,
        },
      })

      // Check that ModernLayout component is rendered
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(true)
    })
  })

  describe('props passing', () => {
    it('passes correct props to ClassicLayout', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'classic',
          isCollapsed: false,
          moreThanOneTag: true,
          isLoading: false,
          onShowMore: undefined,
        },
      })

      const classicLayout = wrapper.findComponent({ name: 'ClassicLayout' })
      expect(classicLayout.props('tag')).toEqual(mockTag)
    })

    it('passes correct props to ModernLayout', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'modern',
          isCollapsed: false,
          moreThanOneTag: false,
          isLoading: false,
          onShowMore: undefined,
        },
      })

      const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
      expect(modernLayout.props('tag')).toEqual(mockTag)
      expect(modernLayout.props('moreThanOneTag')).toBe(false)
    })
  })

  describe('slot content', () => {
    it('renders slot content in ClassicLayout', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'classic',
          moreThanOneTag: true,
          isCollapsed: false,
          isLoading: false,
          onShowMore: undefined,
        },
        slots: {
          default: '<div data-testid="slot-content">Slot content</div>',
        },
      })

      expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="slot-content"]').text()).toBe('Slot content')
    })

    it('renders slot content in ModernLayout', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'modern',
          moreThanOneTag: false, // Set to false so slot is rendered
          isLoading: false,
          isCollapsed: false,
          onShowMore: undefined,
        },
        slots: {
          default: '<div data-testid="slot-content">Modern slot content</div>',
        },
      })

      expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="slot-content"]').text()).toBe('Modern slot content')
    })
  })
})
