import type { TraversedTag } from '@/features/traverse-schema'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Tag from './Tag.vue'

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
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="classic-layout"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="modern-layout"]').exists()).toBe(false)
    })

    it('renders ModernLayout when layout is modern', () => {
      const wrapper = mount(Tag, {
        props: {
          tag: mockTag,
          layout: 'modern',
          moreThanOneTag: true,
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="classic-layout"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="modern-layout"]').exists()).toBe(true)
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
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
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
          moreThanOneTag: true,
        },
        slots: {
          default: '<div data-testid="slot-content">Modern slot content</div>',
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"><slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="slot-content"]').text()).toBe('Modern slot content')
    })
  })
})
