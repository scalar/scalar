import type { TraversedTag } from '@/features/traverse-schema'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ClassicLayout from './ClassicLayout.vue'

describe('ClassicLayout', () => {
  const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    id: 'test-tag',
    title: 'Test Tag',
    children: [],
    isGroup: false,
    tag: {
      name: 'test-tag',
      description: 'Test description',
    },
    ...overrides,
  })

  describe('tag title rendering', () => {
    it('renders the tag title', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
    })

    it('handles tag with empty title', () => {
      const mockTag = createMockTag({
        title: '',
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
        slots: {
          default: '<div class="slot-content">Slot content here</div>',
        },
      })

      // Should still render the slot content even with empty title
      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Slot content here')

      // The header structure should still exist but with no title text
      expect(wrapper.findComponent({ name: 'SectionHeaderTag' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Anchor' }).exists()).toBe(true)
    })

    it('handles tag with special characters in title', () => {
      const mockTag = createMockTag({
        title: 'API & Webhooks (v2.0)',
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('API & Webhooks (v2.0)')
    })
  })

  describe('tag description rendering', () => {
    it('renders tag description when provided', () => {
      const mockTag = createMockTag({
        tag: {
          name: 'test-tag',
          description: 'This is a detailed description of the tag',
        },
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('This is a detailed description of the tag')
    })

    it('handles tag without description gracefully', () => {
      const mockTag = createMockTag({
        tag: {
          name: 'test-tag',
          description: undefined,
        },
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      expect(wrapper.find('.tag-description').exists()).toBe(true)
    })

    it('handles tag with empty description', () => {
      const mockTag = createMockTag({
        tag: {
          name: 'test-tag',
          description: '',
        },
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe('')
    })

    it('handles tag with HTML in description', () => {
      const mockTag = createMockTag({
        tag: {
          name: 'test-tag',
          description: '<p>HTML description with <strong>bold</strong> text</p>',
        },
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('HTML description with bold text')
    })
  })

  describe('component structure', () => {
    it('renders SectionContainerAccordion as root element', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      const accordion = wrapper.findComponent({ name: 'SectionContainerAccordion' })
      expect(accordion.exists()).toBe(true)
      expect(wrapper.element.tagName).toBe('DIV') // Vue test utils wraps in div
    })

    it('renders anchor with correct id', () => {
      const mockTag = createMockTag({
        id: 'custom-tag-id',
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      const anchor = wrapper.findComponent({ name: 'Anchor' })
      expect(anchor.props('id')).toBe('custom-tag-id')
    })

    it('renders SectionHeaderTag with level 2', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      const sectionHeaderTag = wrapper.findComponent({ name: 'SectionHeaderTag' })
      expect(sectionHeaderTag.props('level')).toBe(2)
    })

    it('applies correct CSS classes', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.find('.tag-section').exists()).toBe(true)
      expect(wrapper.find('.tag-name').exists()).toBe(true)
      expect(wrapper.find('.tag-description').exists()).toBe(true)
    })
  })

  describe('ScalarMarkdown integration', () => {
    it('renders ScalarMarkdown with correct props', () => {
      const mockTag = createMockTag({
        tag: {
          name: 'test-tag',
          description: 'Markdown description with **bold** text',
        },
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe('Markdown description with **bold** text')
      expect(markdown.props('withImages')).toBe(true)
    })
  })

  describe('slot content', () => {
    it('renders slot content', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
        slots: {
          default: '<div class="slot-content">Slot content here</div>',
        },
      })

      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Slot content here')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles tag with null tag property', () => {
      const mockTag = createMockTag({
        tag: null as any,
      })

      const wrapper = mount(ClassicLayout, {
        props: {
          tag: mockTag,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      // Should still render the markdown component but with undefined value
      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBeUndefined()
    })
  })
})
