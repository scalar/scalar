import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { InfoObject, OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref } from 'vue'

import DownloadLink from '@/v2/blocks/scalar-info-block/components/DownloadLink.vue'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block/hooks/useSidebar'

import InfoBlock from './InfoBlock.vue'

// Mock the useSidebar hook and SIDEBAR_SYMBOL
vi.mock('@/v2/blocks/scalar-sidebar-block/hooks/useSidebar', () => ({
  useSidebar: vi.fn(),
  SIDEBAR_SYMBOL: Symbol(),
}))

const mockUseSidebar = useSidebar

// Set default values for the mocks
beforeEach(() => {
  vi.mocked(mockUseSidebar).mockReturnValue({
    collapsedSidebarItems: reactive({}),
    isSidebarOpen: ref(false),
    items: computed(() => ({
      entries: [],
      entities: new Map<string, TraversedEntry>(),
    })),
    scrollToOperation: vi.fn(),
    setCollapsedSidebarItem: vi.fn(),
    toggleCollapsedSidebarItem: vi.fn(),
  })
})

describe('InfoBlock', () => {
  const mockInfo: InfoObject = {
    title: 'Test API',
    version: '1.0.0',
  }

  it('uses "after" slot for classic layout', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: mockInfo,
        layout: 'classic',
        options: {
          getOriginalDocument() {
            return '{}'
          },
        },
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })

  it('uses "aside" slot for modern layout', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: mockInfo,
        layout: 'modern',
        options: {
          getOriginalDocument() {
            return '{}'
          },
        },
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })

  it('generates filename from title', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: {
          title: 'Hello World API!',
          description: '',
          version: '1.0.0',
        },
        layout: 'modern',
        options: {
          getOriginalDocument() {
            return '{}'
          },
        },
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    const downloadLink = wrapper.findComponent(DownloadLink)
    expect(downloadLink.props('title')).toBe('Hello World API!')
  })
})
