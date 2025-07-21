import { ScalarMarkdown } from '@scalar/components'
import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import Description from './Description.vue'
import { createMockNavState } from '@/helpers/test-utils'
import { useNavState } from '@/hooks/useNavState'
import type { Heading } from '@scalar/types'

// Mock the scrollToId function
vi.mock('@scalar/helpers/dom/scroll-to-id')

vi.mock('@/hooks/useNavState')

describe('Description', () => {
  const mockScrollToId = scrollToId

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock document properties
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      writable: true,
    })
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      writable: true,
    })

    vi.mocked(useNavState).mockReturnValue(createMockNavState('description/test-heading'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when no value is provided', () => {
    const wrapper = mount(Description)
    expect(wrapper.find('.introduction-description').exists()).toBe(false)
  })

  it('renders markdown content when value is provided', () => {
    const wrapper = mount(Description, {
      props: {
        value: '# Hello World',
      },
    })
    expect(wrapper.findComponent(ScalarMarkdown).exists()).toBe(true)
    expect(wrapper.find('.introduction-description').exists()).toBe(true)
  })

  it('splits content into sections', () => {
    const wrapper = mount(Description, {
      props: {
        value: '# Heading 1\nContent 1\n# Heading 2\nContent 2',
      },
    })
    const sections = wrapper.findAllComponents(ScalarMarkdown)
    expect(sections).toHaveLength(4) // 2 headings + 2 content sections
  })

  it('prefixes the heading section id', () => {
    vi.mocked(useNavState).mockReturnValue({
      ...createMockNavState('description/test-heading'),
      getHeadingId: (heading: Heading) => `description/${heading.slug}`,
    })
    const wrapper = mount(Description, {
      props: {
        value: '# Test Heading',
      },
    })
    const heading = wrapper.find('h1')
    expect(heading.attributes('id')).toBe('description/test-heading')
  })

  describe('onMounted scroll behavior', () => {
    it('does not scroll when hash does not start with description', () => {
      vi.mocked(useNavState).mockReturnValue(createMockNavState('something-else'))

      mount(Description, {
        props: {
          value: '# Test Heading',
        },
      })

      expect(mockScrollToId).not.toHaveBeenCalled()
    })

    it('scrolls immediately when hash starts with description and content is scrollable', () => {
      // Set up scrollable content
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1200,
        writable: true,
      })
      Object.defineProperty(document.documentElement, 'clientHeight', {
        value: 800,
        writable: true,
      })

      mount(Description, {
        props: {
          value: '# Test Heading',
        },
      })

      expect(mockScrollToId).toHaveBeenCalledWith('description/test-heading')
      expect(mockScrollToId).toHaveBeenCalledTimes(1)
    })

    it('scrolls with delay when hash starts with description but content is not scrollable', () => {
      // Set up non-scrollable content
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 600,
        writable: true,
      })
      Object.defineProperty(document.documentElement, 'clientHeight', {
        value: 800,
        writable: true,
      })

      mount(Description, {
        props: {
          value: '# Test Heading',
        },
      })

      // Should not scroll immediately
      expect(mockScrollToId).not.toHaveBeenCalled()

      // Fast-forward time by 500ms
      vi.advanceTimersByTime(500)

      // Should scroll after the timeout
      expect(mockScrollToId).toHaveBeenCalledWith('description/test-heading')
      expect(mockScrollToId).toHaveBeenCalledTimes(1)
    })

    it('handles edge case where scrollHeight equals clientHeight', () => {
      // Set up content where scrollHeight equals clientHeight
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 800,
        writable: true,
      })
      Object.defineProperty(document.documentElement, 'clientHeight', {
        value: 800,
        writable: true,
      })

      mount(Description, {
        props: {
          value: '# Test Heading',
        },
      })

      // Should not scroll immediately
      expect(mockScrollToId).not.toHaveBeenCalled()

      // Fast-forward time by 500ms
      vi.advanceTimersByTime(500)

      // Should scroll after the timeout
      expect(mockScrollToId).toHaveBeenCalledWith('description/test-heading')
      expect(mockScrollToId).toHaveBeenCalledTimes(1)
    })

    it('handles multiple description hashes correctly', () => {
      vi.mocked(useNavState).mockReturnValue({
        ...createMockNavState('description/another-heading'),
        getHeadingId: (heading: Heading) => `description/${heading.slug}`,
      })

      // Set up scrollable content
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1200,
        writable: true,
      })
      Object.defineProperty(document.documentElement, 'clientHeight', {
        value: 800,
        writable: true,
      })

      mount(Description, {
        props: {
          value: '# Another Heading',
        },
      })

      expect(mockScrollToId).toHaveBeenCalledWith('description/another-heading')
      expect(mockScrollToId).toHaveBeenCalledTimes(1)
    })
  })
})
