import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InfoBlock from './InfoBlock.vue'

import { useSidebar } from '@/features/sidebar/hooks/useSidebar'
import { computed, reactive, ref } from 'vue'

// Mock the useSidebar hook and SIDEBAR_SYMBOL
vi.mock('@/features/sidebar/hooks/useSidebar', () => ({
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
      titles: new Map<string, string>(),
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
        getOriginalDocument() {
          return '{}'
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
        getOriginalDocument() {
          return '{}'
        },
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })
})
