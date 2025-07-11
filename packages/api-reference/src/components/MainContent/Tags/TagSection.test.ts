import type { TraversedTag } from '@/features/traverse-schema'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TagSection from './TagSection.vue'

// Mock the useConfig hook
vi.mock('@/hooks/useConfig', () => ({
  useConfig: () => ({
    isLoading: false,
  }),
}))

// Mock the sidebar like in ModernLayout.test.ts
vi.mock('@/features/sidebar', () => ({
  useSidebar: vi.fn(() => ({
    collapsedSidebarItems: {},
    isSidebarOpen: { value: true },
    items: { entries: [], titles: new Map() },
    scrollToOperation: vi.fn(),
    setCollapsedSidebarItem: vi.fn(),
    toggleCollapsedSidebarItem: vi.fn(),
  })),
}))

describe('TagSection', () => {
  const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    id: 'test-tag',
    title: 'Test Tag',
    tag: {
      description: 'This is a test tag description',
    },
    children: [],
    isGroup: false,
    ...overrides,
  })

  it('renders tag title and description', () => {
    const mockTag = createMockTag()

    const wrapper = mount(TagSection, {
      props: {
        tag: mockTag,
      },
    })

    expect(wrapper.text()).toContain('Test Tag')
    expect(wrapper.text()).toContain('This is a test tag description')
  })

  it('handles tag with null tag property gracefully', () => {
    const mockTag = createMockTag({ tag: null as any })

    const wrapper = mount(TagSection, {
      props: {
        tag: mockTag,
      },
    })

    expect(wrapper.text()).toContain('Test Tag')
    expect(wrapper.text()).toContain('')
  })

  it('handles tag with empty description', () => {
    const mockTag = createMockTag({
      tag: {
        description: '',
      },
    })

    const wrapper = mount(TagSection, {
      props: {
        tag: mockTag,
      },
    })

    expect(wrapper.text()).toContain('Test Tag')
    expect(wrapper.text()).toContain('')
  })
})
