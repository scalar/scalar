import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import CopyAsyncApiMarkdownButton from '@/components/Content/AsyncApi/CopyAsyncApiMarkdownButton.vue'

import Tag from './Tag.vue'

describe('Tag', () => {
  it.each(['modern', 'classic'] as const)(
    'renders documentation alongside header actions in the %s tag section',
    (layout) => {
      const wrapper = mount(Tag, {
        props: {
          tag: {
            type: 'tag',
            id: 'orders',
            title: 'Orders',
            name: 'Orders',
            isGroup: false,
            externalDocs: { url: 'https://example.com/orders', description: 'Orders guide' },
          },
          layout,
          moreThanOneTag: true,
          isCollapsed: false,
          eventBus: null,
        },
        slots: { actions: '<button>Copy Page</button>' },
      })
      const link = wrapper.get('a')
      expect(link.attributes('href')).toBe('https://example.com/orders')
      expect(wrapper.findAll('button').some((button) => button.text() === 'Copy Page')).toBe(true)
      expect(link.text()).toBe('Orders guide')
      expect(link.element.closest('button')).toBeNull()
    },
  )

  const mockTag: TraversedTag = {
    type: 'tag',
    id: 'test-tag',
    title: 'Test Tag',
    children: [],
    name: 'test-tag',
    description: 'A test tag description',
    isGroup: false,
  }

  it.each(['modern', 'classic'] as const)('renders header actions alongside content in the %s layout', (layout) => {
    const eventBus = createWorkspaceEventBus()
    const onToggle = vi.fn()
    const onCopy = vi.fn()
    eventBus.on('toggle:nav-item', onToggle)
    const wrapper = mount(Tag, {
      props: { tag: mockTag, layout, moreThanOneTag: true, isCollapsed: false, eventBus },
      slots: {
        actions: () => h('button', { onClick: onCopy }, 'Copy Page'),
        default: '<p>Tag content</p>',
      },
    })

    expect(wrapper.text()).toContain('Test Tag')
    expect(wrapper.text()).toContain('Tag content')
    const actions = wrapper.findAll('button').filter((button) => button.text() === 'Copy Page')
    expect(actions.length).toBe(1)
    // Interactive actions must not be nested inside the collapse control.
    expect(actions[0]!.element.parentElement?.closest('button')).toBeNull()
    actions[0]!.element.click()
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it.each(['modern', 'classic'] as const)(
    'keeps header actions available while collapsed in the %s layout',
    (layout) => {
      const wrapper = mount(Tag, {
        props: { tag: mockTag, layout, moreThanOneTag: true, isCollapsed: true, eventBus: null },
        slots: { actions: '<button>Copy Page</button>', default: '<p>Tag content</p>' },
      })

      expect(wrapper.text()).toContain('Copy Page')
      expect(wrapper.text()).not.toContain('Tag content')
    },
  )

  it.each(['modern', 'classic'] as const)('accepts an empty actions slot in the %s layout', (layout) => {
    const wrapper = mount(Tag, {
      props: { tag: mockTag, layout, moreThanOneTag: true, isCollapsed: false, eventBus: null },
      slots: { actions: () => [], default: '<p>Tag content</p>' },
    })

    expect(wrapper.text()).toContain('Tag content')
    expect(wrapper.findAll('button').filter((button) => button.text() === 'Copy Page').length).toBe(0)
  })

  it('preserves the hidden default tag header in modern layout when actions are supplied', () => {
    const wrapper = mount(Tag, {
      props: {
        tag: { ...mockTag, title: 'default', description: '' },
        layout: 'modern',
        moreThanOneTag: false,
        isCollapsed: false,
        eventBus: null,
      },
      slots: { actions: '<button>Copy Page</button>', default: '<p>Tag content</p>' },
    })

    expect(wrapper.text()).not.toContain('Copy Page')
    expect(wrapper.text()).toContain('Tag content')
  })

  it('preserves the classic collapse control when actions are supplied', async () => {
    const eventBus = createWorkspaceEventBus()
    const onToggle = vi.fn()
    eventBus.on('toggle:nav-item', onToggle)
    const wrapper = mount(Tag, {
      props: { tag: mockTag, layout: 'classic', moreThanOneTag: true, isCollapsed: false, eventBus },
      slots: { actions: '<button>Copy Page</button>', default: '<p>Tag content</p>' },
    })

    await wrapper.get('button[aria-expanded]').trigger('click')
    expect(onToggle).toHaveBeenCalledExactlyOnceWith({ id: 'test-tag', open: false })
    await wrapper.setProps({ isCollapsed: true })
    expect(wrapper.text()).not.toContain('Tag content')
    expect(wrapper.text()).toContain('Copy Page')
  })

  describe('layout rendering', () => {
    it('renders ClassicLayout when layout is classic', () => {
      const wrapper = mount(Tag, {
        props: {
          eventBus: null,
          tag: mockTag,
          layout: 'classic',
          moreThanOneTag: true,
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
          eventBus: null,
          tag: mockTag,
          layout: 'modern',
          moreThanOneTag: true,
          isCollapsed: false,
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
          eventBus: null,
          tag: mockTag,
          layout: 'classic',
          isCollapsed: false,
          moreThanOneTag: true,
          onShowMore: undefined,
        },
      })

      const classicLayout = wrapper.findComponent({ name: 'ClassicLayout' })
      expect(classicLayout.props('tag')).toEqual(mockTag)
    })

    it('passes correct props to ModernLayout', () => {
      const wrapper = mount(Tag, {
        props: {
          eventBus: null,
          tag: mockTag,
          layout: 'modern',
          isCollapsed: false,
          moreThanOneTag: false,
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
          eventBus: null,
          tag: mockTag,
          layout: 'classic',
          moreThanOneTag: true,
          isCollapsed: false,
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
          eventBus: null,
          tag: mockTag,
          layout: 'modern',
          moreThanOneTag: false, // Set to false so slot is rendered
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

  it.each(['modern', 'classic'] as const)(
    'uses the tag name for AsyncAPI actions and supports overrides in %s',
    (layout) => {
      const asyncApiDocument = {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1', tags: [{ name: 'orders' }] },
      } as AsyncApiDocument
      const props = {
        tag: { ...mockTag, name: 'orders', title: 'Order events' },
        layout,
        moreThanOneTag: true,
        isCollapsed: true,
        eventBus: null,
        asyncApiDocument,
      }
      const wrapper = mount(Tag, { props })
      expect(wrapper.getComponent(CopyAsyncApiMarkdownButton).props('selection')).toEqual({ tag: 'orders' })
      expect(wrapper.text()).toContain('Copy as Markdown')
      wrapper.unmount()
      const custom = mount(Tag, { props, slots: { actions: '<button>Custom action</button>' } })
      expect(custom.text()).toContain('Custom action')
      expect(custom.text()).not.toContain('Copy as Markdown')
      custom.unmount()
      const hidden = mount(Tag, { props, slots: { actions: () => [] } })
      expect(hidden.text()).not.toContain('Copy as Markdown')
      hidden.unmount()
      const group = mount(Tag, { props: { ...props, tag: { ...props.tag, isGroup: true } } })
      expect(group.text()).not.toContain('Copy as Markdown')
      group.unmount()
    },
  )
  it('keeps a real AsyncAPI tag named default visible', () => {
    const wrapper = mount(Tag, {
      props: {
        tag: { ...mockTag, name: 'default', title: 'default', description: '' },
        layout: 'modern',
        moreThanOneTag: false,
        isCollapsed: false,
        eventBus: null,
        asyncApiDocument: { asyncapi: '3.1.0', info: { title: 'Events', version: '1' } } as AsyncApiDocument,
      },
    })
    expect(wrapper.text()).toContain('default')
    expect(wrapper.text()).toContain('Copy as Markdown')
    wrapper.unmount()
  })
})
