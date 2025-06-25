import { DownloadLink } from '@/features/download-link'
import { useSidebar } from '@/features/sidebar/hooks/useSidebar'
import type { Spec } from '@scalar/types/legacy'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { computed, reactive, ref } from 'vue'

import Introduction from './Introduction.vue'

// Mock the useSidebar hook and SIDEBAR_SYMBOL
vi.mock('@/features/sidebar/hooks/useSidebar', () => ({
  useSidebar: vi.fn(),
  SIDEBAR_SYMBOL: Symbol(),
}))

const mockUseSidebar = useSidebar as Mock<[], ReturnType<typeof useSidebar>>

// Set default values for the mocks
beforeEach(() => {
  mockUseSidebar.mockReturnValue({
    collapsedSidebarItems: reactive({}),
    isSidebarOpen: ref(false),
    items: computed(() => ({
      entries: [],
      titles: new Map<string, string>(),
    })),
    scrollToOperation: vi.fn(),
    setCollapsedSidebarItem: vi.fn(),
    toggleCollapsedSidebarItem: vi.fn(),
  })
})

describe('Introduction', () => {
  it('renders the given information', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        description: 'Example description',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    expect(wrapper.html()).toContain('Hello World')
    expect(wrapper.html()).toContain('Example description')
    expect(wrapper.html()).toContain('v1.0.0')
  })

  it('renders loading state when info is empty', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: '',
        description: '',
        version: '',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  /**
   * We use the .introduction-section class for theming widely
   * so we need to make sure it's there
   */
  it('exposes the .introduction-section class for theming', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        description: 'Example description',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    const section = wrapper.get('.introduction-section')

    expect(section.html()).toContain('Hello World')
  })

  it('generates filename from title', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World API!',
        description: '',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    const downloadLink = wrapper.findComponent(DownloadLink)
    expect(downloadLink.props('title')).toBe('Hello World API!')
  })

  it('shows version badge when version exists', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: '2.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    expect(wrapper.html()).toContain('v2.0.0')
  })

  it(`doesn't prefix version with v when version is not a number`, () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: 'beta',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    expect(wrapper.html()).not.toContain('vbeta')
    expect(wrapper.html()).toContain('beta')
  })

  it(`doesn't prefix version with v when version is already prefixed`, () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: 'v1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        document: example,
      },
    })

    expect(wrapper.html()).toContain('v1.0.0')
  })

  it('prefixes version with v when version is a number', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        // @ts-expect-error testing invalid type
        version: 1,
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        // @ts-expect-error testing invalid type
        document: example,
      },
    })

    expect(wrapper.html()).toContain('v1')
  })

  it(`doesn't output the version if something is wrong with the version`, () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        // @ts-expect-error testing invalid type
        version: ['foobar'],
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        // @ts-expect-error testing invalid type
        document: example,
      },
    })

    expect(wrapper.html()).not.toContain('foobar')
  })
})
