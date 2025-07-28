import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ApiReferenceWorkspace from './ApiReferenceWorkspace.vue'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createMockLocalStorage, createMockStore } from '@/helpers/test-utils'
import { REFERENCE_LS_KEYS } from '@scalar/helpers/object/local-storage'

// vi.mock('@scalar/oas-utils/helpers', async () => ({
//   redirectToProxy: vi.fn((proxyUrl, url) => `${proxyUrl}?url=${encodeURIComponent(url)}`),
// }))

vi.mock('@unhead/vue', () => ({
  useSeoMeta: vi.fn(),
}))

vi.mock('@/v2/events')

vi.mock('@vueuse/core', async () => ({
  ...(await import('@vueuse/core')),
  useFavicon: vi.fn(),
}))

vi.mock('@/hooks/useNavState', async () => ({
  ...(await import('@/hooks/useNavState')),
  NAV_STATE_SYMBOL: Symbol('nav-state'),
}))

describe('ApiReferenceWorkspace', () => {
  let wrapper: VueWrapper
  let mockStore: WorkspaceStore
  let mockConfiguration: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Clear localStorage before each test
    localStorage.clear()

    // Create mock configuration
    mockConfiguration = {
      title: 'Test API',
      content: {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      },
    }

    // Create mock store
    mockStore = createMockStore(mockConfiguration.content)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('component rendering', () => {
    it('renders the component with basic props', async () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      await flushPromises()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ApiReferenceLayout' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Test API')
    })

    it('renders custom CSS when provided', () => {
      const configWithCss = {
        ...mockConfiguration,
        customCss: '.custom-style { color: red; }',
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithCss,
          store: mockStore,
        },
      })

      const styleElement = wrapper.find('style')
      expect(styleElement.exists()).toBe(true)
      expect(styleElement.text()).toContain('.custom-style { color: red; }')
    })

    it('does render style tag when no custom CSS, for the base theme', () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      const styleElement = wrapper.find('style')
      expect(styleElement.exists()).toBe(true)
    })
  })

  describe('document management', () => {
    it('adds document to store when content is provided', async () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      await nextTick()

      expect(mockStore.addDocumentSync).toHaveBeenCalledWith({
        name: 'test-api',
        document: mockConfiguration.content,
      })
    })

    it('adds document to store when URL is provided', async () => {
      const configWithUrl = {
        ...mockConfiguration,
        url: 'https://example.com/api/spec.json',
        content: undefined,
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithUrl,
          store: mockStore,
        },
      })

      await nextTick()

      expect(mockStore.addDocument).toHaveBeenCalledWith({
        name: 'test-api',
        url: 'https://example.com/api/spec.json',
        fetch: expect.any(Function),
      })
    })

    it('replaces existing document when name already exists', async () => {
      // Mock that document already exists
      mockStore.workspace.documents = {
        'existing-document': {} as any,
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: {
            slug: 'existing-document',
            content: mockConfiguration.content,
          },
          store: mockStore,
        },
      })

      await nextTick()

      expect(mockStore.replaceDocument).toHaveBeenCalledWith('existing-document', mockConfiguration.content)
      expect(mockStore.update).toHaveBeenCalledWith('x-scalar-active-document', 'existing-document')
    })
  })

  describe('dark mode handling', () => {
    it('updates dark mode state when configuration changes', async () => {
      const configWithDarkMode = {
        ...mockConfiguration,
        darkMode: true,
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithDarkMode,
          store: mockStore,
        },
      })

      await nextTick()

      expect(mockStore.update).toHaveBeenCalledWith('x-scalar-dark-mode', true)
    })

    it('handles dark mode toggle event', async () => {
      const { onCustomEvent } = await import('@/v2/events')
      const mockOnCustomEvent = vi.mocked(onCustomEvent)

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      await nextTick()

      // Simulate the event handler being called
      const eventHandler = mockOnCustomEvent.mock.calls.find((call) => call[1] === 'scalar-update-dark-mode')?.[2]

      if (eventHandler) {
        eventHandler({ detail: { value: true } })
        expect(mockStore.update).toHaveBeenCalledWith('x-scalar-dark-mode', true)
      }
    })
  })

  describe('client selection', () => {
    let localStorageSpy: any

    beforeEach(() => {
      // Create a spy for localStorage
      localStorageSpy = createMockLocalStorage()
      // Mock global localStorage
      Object.defineProperty(window, 'localStorage', {
        value: localStorageSpy,
        writable: true,
      })
    })

    afterEach(() => {
      // Clear all mocks
      vi.clearAllMocks()
    })

    it('loads stored client on mount', async () => {
      localStorageSpy.getItem.mockReturnValue('node/fetch')

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      expect(mockStore.update).toHaveBeenCalledWith('x-scalar-default-client', 'node/fetch')
    })

    it('handles client selection event', async () => {
      const { onCustomEvent } = await import('@/v2/events')
      const mockOnCustomEvent = vi.mocked(onCustomEvent)

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      await nextTick()

      // Simulate the event handler being called
      const eventHandler = mockOnCustomEvent.mock.calls.find((call) => call[1] === 'scalar-update-selected-client')?.[2]

      if (eventHandler) {
        eventHandler({ detail: 'new-client' })
        expect(mockStore.update).toHaveBeenCalledWith('x-scalar-default-client', 'new-client')
        expect(localStorage.setItem).toHaveBeenCalledWith(REFERENCE_LS_KEYS.SELECTED_CLIENT, 'new-client')
      }
    })
  })

  describe('document selection', () => {
    it('handles active document update event', async () => {
      const { onCustomEvent } = await import('@/v2/events')
      const mockOnCustomEvent = vi.mocked(onCustomEvent)

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      await nextTick()

      // Simulate the event handler being called
      const eventHandler = mockOnCustomEvent.mock.calls.find((call) => call[1] === 'scalar-update-active-document')?.[2]

      if (eventHandler) {
        eventHandler({ detail: { value: 'new-document' } })
        expect(mockStore.update).toHaveBeenCalledWith('x-scalar-active-document', 'new-document')
      }
    })
  })

  describe('default HTTP client configuration', () => {
    it('updates default client when configuration changes', async () => {
      const { isClient } = await import('@/v2/blocks/scalar-request-example-block/helpers/find-client')
      const configWithDefaultClient = {
        ...mockConfiguration,
        defaultHttpClient: {
          targetKey: 'js',
          clientKey: 'fetch',
        },
      }

      vi.mocked(isClient).mockReturnValue(true)

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithDefaultClient,
          store: mockStore,
        },
      })

      await nextTick()

      expect(mockStore.update).toHaveBeenCalledWith('x-scalar-default-client', 'js/fetch')
    })

    it('does not update default client when isClient returns false', async () => {
      const { isClient } = await import('@/v2/blocks/scalar-request-example-block/helpers/find-client')
      const configWithDefaultClient = {
        ...mockConfiguration,
        defaultHttpClient: {
          targetKey: 'js',
          clientKey: 'fetch',
        },
      }

      vi.mocked(isClient).mockReturnValue(false)

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithDefaultClient,
          store: mockStore,
        },
      })

      await nextTick()

      expect(mockStore.update).not.toHaveBeenCalledWith('x-scalar-default-client', expect.any(String))
    })
  })

  describe('SEO and favicon', () => {
    it('sets SEO meta when metadata is provided', async () => {
      const { useSeoMeta } = await import('@unhead/vue')
      const configWithMeta = {
        ...mockConfiguration,
        metaData: {
          title: 'Test API',
          description: 'Test API description',
        },
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithMeta,
          store: mockStore,
        },
      })

      await nextTick()

      expect(useSeoMeta).toHaveBeenCalledWith(configWithMeta.metaData)
    })

    it('sets favicon when provided', async () => {
      const { useFavicon } = await import('@vueuse/core')
      const configWithFavicon = {
        ...mockConfiguration,
        favicon: '/favicon.ico',
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithFavicon,
          store: mockStore,
        },
      })

      await nextTick()

      expect(useFavicon).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  describe('proxy functionality', () => {
    it('creates proxy function for external requests', async () => {
      const { redirectToProxy } = await import('@scalar/oas-utils/helpers')
      const configWithProxy = {
        ...mockConfiguration,
        proxyUrl: 'https://proxy.example.com',
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithProxy,
          store: mockStore,
        },
      })

      await nextTick()

      // The proxy function should be created and used in addDocument
      expect(redirectToProxy).toHaveBeenCalled()
    })
  })

  describe('slot rendering', () => {
    it('renders footer slot', () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
        slots: {
          footer: '<div>Footer content</div>',
        },
      })

      expect(wrapper.html()).toContain('Footer content')
    })

    it('renders sidebar-start slot', () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
        slots: {
          'sidebar-start': '<div>Sidebar content</div>',
        },
      })

      expect(wrapper.html()).toContain('Sidebar content')
    })
  })

  describe('event emission', () => {
    it('emits updateContent event', async () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
        },
      })

      const layoutComponent = wrapper.findComponent({ name: 'ApiReferenceLayout' })
      await layoutComponent.vm.$emit('updateContent', { some: 'content' })

      expect(wrapper.emitted('updateContent')).toBeTruthy()
      expect(wrapper.emitted('updateContent')?.[0]).toEqual([{ some: 'content' }])
    })
  })

  describe('edge cases', () => {
    it('handles empty configuration gracefully', () => {
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: undefined,
          store: mockStore,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('handles configuration without content or URL', () => {
      const emptyConfig = {
        title: 'Empty API',
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: emptyConfig,
          store: mockStore,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(mockStore.addDocumentSync).not.toHaveBeenCalled()
      expect(mockStore.addDocument).not.toHaveBeenCalled()
    })

    it('handles store without workspace documents', () => {
      const emptyStore = {
        ...mockStore,
        workspace: {
          ...mockStore.workspace,
          documents: {},
        },
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: emptyStore,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })
})
