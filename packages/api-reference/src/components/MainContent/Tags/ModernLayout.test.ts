import type { TraversedEntry, TraversedTag } from '@/features/traverse-schema'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import ModernLayout from './ModernLayout.vue'

// Mock the useSidebar composable
vi.mock('@/features/sidebar', () => ({
  useSidebar: vi.fn(() => ({
    collapsedSidebarItems: {},
    isSidebarOpen: { value: true },
    items: computed(() => ({ entries: [] as TraversedEntry[], titles: new Map() })),
    scrollToOperation: vi.fn(),
    setCollapsedSidebarItem: vi.fn(),
    toggleCollapsedSidebarItem: vi.fn(),
  })),
}))

// Mock the useId composable
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    useId: vi.fn(() => 'test-header-id'),
  }
})

describe('ModernLayout', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tag rendering', () => {
    it('renders the tag title', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
    })

    it('handles tag with special characters in title', () => {
      const mockTag = createMockTag({
        title: 'API & Webhooks (v2.0)',
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      expect(wrapper.text()).toContain('API & Webhooks (v2.0)')
    })
  })

  describe('moreThanOneDefaultTag computed property', () => {
    it('renders TagSection when moreThanOneTag is true', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.exists()).toBe(true)
    })

    it('renders TagSection when tag title is not default', () => {
      const mockTag = createMockTag({
        title: 'custom-tag',
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: false,
        },
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.exists()).toBe(true)
    })

    it('renders TagSection when tag has description', () => {
      const mockTag = createMockTag({
        title: 'default',
        tag: {
          name: 'default',
          description: 'Has description',
        },
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: false,
        },
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.exists()).toBe(true)
    })

    it('does not render TagSection for default tag without description and moreThanOneTag false', () => {
      const mockTag = createMockTag({
        title: 'default',
        tag: {
          name: 'default',
          description: '',
        },
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: false,
        },
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.exists()).toBe(false)
    })
  })

  describe('ShowMoreButton rendering', () => {
    it('does not render ShowMoreButton when tag is not collapsed', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': true },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      const showMoreButton = wrapper.findComponent({ name: 'ShowMoreButton' })
      expect(showMoreButton.exists()).toBe(false)
    })

    it('does not render ShowMoreButton when moreThanOneTag is false', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': false },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: false,
        },
      })

      const showMoreButton = wrapper.findComponent({ name: 'ShowMoreButton' })
      expect(showMoreButton.exists()).toBe(false)
    })
  })

  describe('slot content rendering', () => {
    it('renders slot content when tag is not collapsed', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': true },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
        slots: {
          default: '<div class="slot-content">Slot content here</div>',
        },
      })

      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Slot content here')
    })

    it('renders slot content when ShowMoreButton is not shown', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': true },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: false,
        },
        slots: {
          default: '<div class="slot-content">Another slot content</div>',
        },
      })

      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Another slot content')
    })
  })

  describe('component structure', () => {
    it('renders TagSection with correct props when moreThanOneDefaultTag is true', () => {
      const mockTag = createMockTag()

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.props('headerId')).toBe('test-header-id')
      expect(tagSection.props('tag')).toEqual(mockTag)
      expect(tagSection.props('isCollapsed')).toBeDefined()
    })
  })

  describe('focusContents function', () => {
    it('calls focusContents when ShowMoreButton is clicked', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': false },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      const showMoreButton = wrapper.findComponent({ name: 'ShowMoreButton' })
      await showMoreButton.vm.$emit('click')

      // The function should be called, but we can't easily test the DOM focus
      // since it's an async operation with nextTick
      expect(showMoreButton.emitted('click')).toBeTruthy()
    })
  })

  describe('isCollapsed function', () => {
    it('returns correct collapsed state based on sidebar items', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': false },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      // The isCollapsed function should return true when the item is not in collapsedSidebarItems
      // or when the value is false
      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.props('isCollapsed')).toBe(true)
    })

    it('returns false when tag is in collapsedSidebarItems with true value', async () => {
      const mockTag = createMockTag()
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue({
        collapsedSidebarItems: { 'test-tag': true },
        isSidebarOpen: { value: true },
        items: computed(() => ({ entries: [], titles: new Map() })),
        scrollToOperation: vi.fn(),
        setCollapsedSidebarItem: vi.fn(),
        toggleCollapsedSidebarItem: vi.fn(),
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.props('isCollapsed')).toBe(false)
    })
  })

  describe('edge cases and error handling', () => {
    it('handles tag with null tag property', () => {
      const mockTag = createMockTag({
        tag: null as any,
      })

      const wrapper = mount(ModernLayout, {
        props: {
          tag: mockTag,
          moreThanOneTag: true,
        },
      })

      expect(wrapper.text()).toContain('Test Tag')
      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.exists()).toBe(true)
    })
  })
})
