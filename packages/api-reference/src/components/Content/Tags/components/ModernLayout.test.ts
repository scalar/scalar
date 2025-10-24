import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import ModernLayout from './ModernLayout.vue'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    useId: vi.fn(() => 'test-header-id'),
  }
})

const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
  type: 'tag',
  id: 'test-tag',
  title: 'Test Tag',
  children: [],
  isGroup: false,
  name: 'test-tag',
  description: 'Test description',
  ...overrides,
})

const mockProps = {
  isLoading: false,
  isCollapsed: false,
}

beforeEach(() => {
  vi.mock('@/components/Lazy/lazyBus', () => ({
    useLazyBus: () => ({
      isReady: computed(() => true),
    }),
  }))
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('TagSection rendering', () => {
  it('renders TagSection when moreThanOneTag is true', () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: true,
      },
    })

    expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
  })

  it('renders TagSection when tag title is not default', () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag({ title: 'custom-tag' }),
        moreThanOneTag: false,
      },
    })

    expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
  })

  it('renders TagSection when tag has description', () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag({
          title: 'default',
          name: 'default',
          description: 'Has description',
        }),
        moreThanOneTag: false,
      },
    })

    expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
  })

  it('does not render TagSection for default tag without description', () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag({
          title: 'default',
          name: 'default',
          description: '',
        }),
        moreThanOneTag: false,
      },
    })

    expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(false)
  })
})

describe('ShowMoreButton rendering', () => {
  it('renders ShowMoreButton when tag is collapsed and moreThanOneTag is true', async () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: true,
        isCollapsed: true,
      },
    })

    expect(wrapper.findComponent({ name: 'ShowMoreButton' }).exists()).toBe(true)
  })

  it('does not render ShowMoreButton when tag is not collapsed', async () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: true,
      },
    })

    expect(wrapper.findComponent({ name: 'ShowMoreButton' }).exists()).toBe(false)
  })

  it('does not render ShowMoreButton when moreThanOneTag is false', async () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: false,
      },
    })

    expect(wrapper.findComponent({ name: 'ShowMoreButton' }).exists()).toBe(false)
  })
})

describe('slot content rendering', () => {
  it('renders slot content when ShowMoreButton is not shown', async () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: false,
      },
      slots: {
        default: '<div class="slot-content">Test content</div>',
      },
    })

    expect(wrapper.find('.slot-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test content')
  })
})

describe('component props and behavior', () => {
  it('passes correct props to TagSection', () => {
    const mockTag = createMockTag()

    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: mockTag,
        moreThanOneTag: true,
      },
    })

    const tagSection = wrapper.findComponent({ name: 'TagSection' })
    expect(tagSection.props('headerId')).toBe('test-header-id')
    expect(tagSection.props('tag')).toEqual(mockTag)
  })

  it('calls setCollapsedSidebarItem when ShowMoreButton is clicked', async () => {
    const onToggleTag = vi.fn()
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: true,
        isCollapsed: true,
        onToggleTag,
      },
    })

    const showMoreButton = wrapper.findComponent({ name: 'ShowMoreButton' })
    await showMoreButton.find('button').trigger('click')

    expect(onToggleTag).toHaveBeenCalledWith('test-tag', true)
  })

  it('handles tag with null tag property gracefully', () => {
    const wrapper = mount(ModernLayout, {
      props: {
        ...mockProps,
        tag: createMockTag(),
        moreThanOneTag: true,
      },
    })

    expect(wrapper.text()).toContain('Test Tag')
    expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
  })
})
