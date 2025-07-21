import type { TraversedTag } from '@/features/traverse-schema'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Tag from './Tag.vue'

// Mock the useSidebar hook
vi.mock('@/features/sidebar', () => ({
  useSidebar: () => ({
    collapsedSidebarItems: {
      'test-tag': false, // This makes isCollapsed return false, so slot content is rendered
    },
  }),
}))

describe('Tag', () => {
  const mockTag: TraversedTag = {
    id: 'test-tag',
    title: 'Test Tag',
    children: [],
    tag: {
      name: 'test-tag',
      description: 'A test tag description',
    },
    isGroup: false,
  }

  describe('layout rendering', () => {
    it('renders ClassicLayout when layout is classic', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'classic',
          moreThanOneTag: true,
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
          moreThanOneTag: true,
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
          moreThanOneTag: false,
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
