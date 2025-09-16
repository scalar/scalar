import { REFERENCE_LS_KEYS } from '@scalar/helpers/object/local-storage'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createMockLocalStorage, createMockStore } from '@/helpers/test-utils'

import ApiReferenceWorkspace from './ApiReferenceWorkspace.vue'

// vi.mock('@scalar/oas-utils/helpers', async () => ({
//   redirectToProxy: vi.fn((proxyUrl, url) => `${proxyUrl}?url=${encodeURIComponent(url)}`),
// }))

vi.mock('@unhead/vue', () => ({
  useSeoMeta: vi.fn(),
}))

vi.mock('@scalar/workspace-store/events')

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

      expect(mockStore.addDocument).toHaveBeenCalledWith({
        name: 'test-api',
        document: mockConfiguration.content,
        config: expect.anything(),
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
        config: expect.anything(),
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
      const { onCustomEvent } = await import('@scalar/workspace-store/events')
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

      const expected = { detail: { value: true } }

      if (eventHandler) {
        eventHandler(expected as CustomEvent<(typeof expected)['detail']>)
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
      const { onCustomEvent } = await import('@scalar/workspace-store/events')
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
        const expected = { detail: 'new-client' }
        eventHandler(expected as CustomEvent<(typeof expected)['detail']>)
        expect(mockStore.update).toHaveBeenCalledWith('x-scalar-default-client', 'new-client')
        expect(localStorage.setItem).toHaveBeenCalledWith(REFERENCE_LS_KEYS.SELECTED_CLIENT, 'new-client')
      }
    })
  })

  describe('document selection', () => {
    it('handles active document update event', async () => {
      const { onCustomEvent } = await import('@scalar/workspace-store/events')
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

      const expected = { detail: { value: 'new-document' } }
      if (eventHandler) {
        eventHandler(expected as CustomEvent<(typeof expected)['detail']>)
        expect(mockStore.update).toHaveBeenCalledWith('x-scalar-active-document', 'new-document')
      }
    })
  })

  describe('default HTTP client configuration', () => {
    it('updates default client when configuration changes', async () => {
      const configWithDefaultClient = {
        ...mockConfiguration,
        defaultHttpClient: {
          targetKey: 'js',
          clientKey: 'fetch',
        },
      }

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
      const configWithDefaultClient = {
        ...mockConfiguration,
        defaultHttpClient: {
          targetKey: 'fake',
          clientKey: 'records',
        },
      }

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
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      const configWithProxy = {
        ...mockConfiguration,
        proxyUrl: 'https://proxy.example.com',
        url: 'https://example.com/api/spec.json',
        content: undefined,
      }

      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: configWithProxy,
          store: mockStore,
        },
      })

      await nextTick()

      // Check that addDocument was called with the proxy configuration
      expect(mockStore.addDocument).toHaveBeenCalledWith({
        name: 'test-api',
        url: 'https://example.com/api/spec.json',
        fetch: expect.any(Function),
        config: {
          'x-scalar-reference-config': expect.objectContaining({
            'slug': 'test-api',
            'title': 'Test API',
            settings: {
              'proxyUrl': 'https://proxy.example.com',
            },
          }),
        },
      })

      // Get the fetch function that was passed to addDocument
      const addDocumentCall = vi.mocked(mockStore.addDocument).mock.calls[0]
      const input = addDocumentCall[0] as { url: string; fetch?: Function }
      const fetchFunction = input.fetch

      // Call the fetch function to see what it does
      expect(fetchFunction).toBeDefined()
      if (fetchFunction) {
        await fetchFunction('https://example.com/api/spec.json')
      }

      // Check that fetch was called with the proxy URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/?scalar_url=https%3A%2F%2Fexample.com%2Fapi%2Fspec.json',
      )
    })
  })

  describe('custom fetch functionality', async () => {
    it('use the provided fetch function to fetch the documents', async () => {
      const fn = vi.fn()
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: {
            title: 'Test API',
            url: 'https://example.com/api/spec.json',
            fetch: async (...args) => {
              fn(...args)
              // Simple mock fetch function that returns a fixed response
              return new Response(JSON.stringify({ openapi: '3.0.0', info: { title: 'Test API' }, paths: {} }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
              })
            },
          },
          store: mockStore,
        },
      })

      await flushPromises()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ApiReferenceLayout' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Test API')

      // Expect the custom fetch function to have been called
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith('https://example.com/api/spec.json', undefined)
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
      const onUpdateContent = vi.fn()
      wrapper = mount(ApiReferenceWorkspace, {
        props: {
          configuration: mockConfiguration,
          store: mockStore,
          onUpdateContent,
        },
      })

      const layoutComponent = wrapper.findComponent({ name: 'ApiReferenceLayout' })
      await layoutComponent.vm.$emit('updateContent', { some: 'content' })
      await nextTick()

      expect(onUpdateContent).toHaveBeenCalledTimes(1)
      expect(onUpdateContent).toHaveBeenCalledWith({ some: 'content' })
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
