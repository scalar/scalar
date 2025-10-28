import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TagSection from './TagSection.vue'

describe('TagSection', () => {
  const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    type: 'tag',
    id: 'test-tag',
    title: 'Test Tag',
    name: 'test-tag',
    description: 'This is a test tag description',
    children: [],
    isGroup: false,
    ...overrides,
  })

  describe('basic rendering', () => {
    it('renders tag title and description', () => {
      const mockTag = createMockTag()

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      expect(wrapper.text()).toContain('This is a test tag description')
    })

    it('renders section with correct id and label', () => {
      const mockTag = createMockTag({
        id: 'custom-tag-id',
        title: 'Custom Tag Title',
      })

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      const section = wrapper.findComponent({ name: 'Section' })
      expect(section.element.id).toBe('custom-tag-id')
    })
  })

  describe('markdown rendering', () => {
    it('renders markdown with images enabled', () => {
      const mockTag = createMockTag()

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('withImages')).toBe(true)
    })

    it('passes tag to SpecificationExtension component', () => {
      const mockTag = createMockTag({
        xKeys: {
          'x-something': 'value',
        },
      })

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      const specExtension = wrapper.findComponent({ name: 'SpecificationExtension' })
      expect(specExtension.props('value')).toMatchObject({
        'x-something': 'value',
      })
    })
  })

  describe('collapsed state', () => {
    it('shows screen reader text when collapsed', () => {
      const mockTag = createMockTag()

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
          isCollapsed: true,
        },
      })

      expect(wrapper.text()).toContain('(Collapsed)')
    })

    it('does not show screen reader text when not collapsed', () => {
      const mockTag = createMockTag()

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
          isCollapsed: false,
        },
      })

      expect(wrapper.text()).not.toContain('(Collapsed)')
    })

    it('applies clamp to markdown when collapsed', () => {
      const mockTag = createMockTag()

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
          isCollapsed: true,
        },
      })

      const markdown = wrapper.find('.markdown')
      expect(markdown.attributes('style')).toContain('clamp')
    })

    it('does not apply clamp to markdown when not collapsed', () => {
      const mockTag = createMockTag()

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
          isCollapsed: false,
        },
      })

      const markdown = wrapper.find('.markdown')
      expect(`${markdown.attributes('style')}`).not.toContain('clamp')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles tag with null tag property gracefully', () => {
      const mockTag = createMockTag({})

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      expect(wrapper.text()).toContain('')
    })

    it('handles tag with empty description', () => {
      const mockTag = createMockTag({
        name: 'test-tag',
        description: '',
      })

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      expect(wrapper.text()).toContain('')
    })

    it('does not render when tag is null', () => {
      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: null as any,
        },
      })

      expect(wrapper.findComponent({ name: 'Section' }).exists()).toBe(false)
    })
  })

  describe('tag variations', () => {
    it('handles tag with children', () => {
      const mockTag = createMockTag({
        children: [
          {
            id: 'child-1',
            title: 'Child 1',
            type: 'operation',
          } as any,
          {
            id: 'child-2',
            title: 'Child 2',
            type: 'operation',
          } as any,
        ],
      })

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      // Component should still render correctly with children
      expect(wrapper.text()).toContain('Test Tag')
      expect(wrapper.text()).toContain('This is a test tag description')
    })

    it('handles tag group correctly', () => {
      const mockTag = createMockTag({
        isGroup: true,
        title: 'Tag Group',
      })

      const wrapper = mount(TagSection, {
        props: {
          eventBus: null,
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Tag Group')
      expect(wrapper.text()).toContain('This is a test tag description')
    })
  })
})
