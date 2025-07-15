import type { TraversedTag } from '@/features/traverse-schema'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ModernLayout from './ModernLayout.vue'
import { createMockSidebar } from '@/helpers/test-utils'

// Mock the sidebar module
vi.mock('@/features/sidebar', () => ({
  useSidebar: vi.fn(() => createMockSidebar()),
}))

// Mock the config hook
vi.mock('@/hooks/useConfig', () => ({
  useConfig: vi.fn(() => ({
    value: {
      onShowMore: vi.fn(),
    },
  })),
}))

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

  const mountComponent = (props: { tag: TraversedTag; moreThanOneTag: boolean }, options = {}) => {
    return mount(ModernLayout, {
      props,
      ...options,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TagSection rendering', () => {
    it('renders TagSection when moreThanOneTag is true', () => {
      const wrapper = mountComponent({
        tag: createMockTag(),
        moreThanOneTag: true,
      })

      expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
    })

    it('renders TagSection when tag title is not default', () => {
      const wrapper = mountComponent({
        tag: createMockTag({ title: 'custom-tag' }),
        moreThanOneTag: false,
      })

      expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
    })

    it('renders TagSection when tag has description', () => {
      const wrapper = mountComponent({
        tag: createMockTag({
          title: 'default',
          tag: { name: 'default', description: 'Has description' },
        }),
        moreThanOneTag: false,
      })

      expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
    })

    it('does not render TagSection for default tag without description', () => {
      const wrapper = mountComponent({
        tag: createMockTag({
          title: 'default',
          tag: { name: 'default', description: '' },
        }),
        moreThanOneTag: false,
      })

      expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(false)
    })
  })

  describe('ShowMoreButton rendering', () => {
    it('renders ShowMoreButton when tag is collapsed and moreThanOneTag is true', async () => {
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue(createMockSidebar({ 'test-tag': false }))

      const wrapper = mountComponent({
        tag: createMockTag(),
        moreThanOneTag: true,
      })

      expect(wrapper.findComponent({ name: 'ShowMoreButton' }).exists()).toBe(true)
    })

    it('does not render ShowMoreButton when tag is not collapsed', async () => {
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue(createMockSidebar({ 'test-tag': true }))

      const wrapper = mountComponent({
        tag: createMockTag(),
        moreThanOneTag: true,
      })

      expect(wrapper.findComponent({ name: 'ShowMoreButton' }).exists()).toBe(false)
    })

    it('does not render ShowMoreButton when moreThanOneTag is false', async () => {
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue(createMockSidebar({ 'test-tag': false }))

      const wrapper = mountComponent({
        tag: createMockTag(),
        moreThanOneTag: false,
      })

      expect(wrapper.findComponent({ name: 'ShowMoreButton' }).exists()).toBe(false)
    })
  })

  describe('slot content rendering', () => {
    it('renders slot content when ShowMoreButton is not shown', async () => {
      const { useSidebar } = await import('@/features/sidebar')
      vi.mocked(useSidebar).mockReturnValue(createMockSidebar({ 'test-tag': true }))

      const wrapper = mountComponent(
        {
          tag: createMockTag(),
          moreThanOneTag: false,
        },
        {
          slots: {
            default: '<div class="slot-content">Test content</div>',
          },
        },
      )

      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test content')
    })
  })

  describe('component props and behavior', () => {
    it('passes correct props to TagSection', () => {
      const mockTag = createMockTag()

      const wrapper = mountComponent({
        tag: mockTag,
        moreThanOneTag: true,
      })

      const tagSection = wrapper.findComponent({ name: 'TagSection' })
      expect(tagSection.props('headerId')).toBe('test-header-id')
      expect(tagSection.props('tag')).toEqual(mockTag)
    })

    it('calls setCollapsedSidebarItem when ShowMoreButton is clicked', async () => {
      const { useSidebar } = await import('@/features/sidebar')
      const mockSidebar = createMockSidebar({ 'test-tag': false })
      vi.mocked(useSidebar).mockReturnValue(mockSidebar)

      const wrapper = mountComponent({
        tag: createMockTag(),
        moreThanOneTag: true,
      })

      const showMoreButton = wrapper.findComponent({ name: 'ShowMoreButton' })
      await showMoreButton.find('button').trigger('click')

      expect(mockSidebar.setCollapsedSidebarItem).toHaveBeenCalledWith('test-tag', true)
    })

    it('handles tag with null tag property gracefully', () => {
      const wrapper = mountComponent({
        tag: createMockTag({ tag: null as any }),
        moreThanOneTag: true,
      })

      expect(wrapper.text()).toContain('Test Tag')
      expect(wrapper.findComponent({ name: 'TagSection' }).exists()).toBe(true)
    })
  })
})
