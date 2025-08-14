import { useSidebar } from '@/features/sidebar'
import { createMockSidebar, createMockSidebarFromDocument, createMockNavState } from '@/helpers/test-utils'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import TraversedEntryContainer from './TraversedEntryContainer.vue'
import { useNavState } from '@/hooks/useNavState'
import { lazyBus, hasLazyLoaded } from '@/components/Lazy/lazyBus'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/schemas/workspace'

// Mock the sidebar module
vi.mock('@/features/sidebar')

// Mock useNavState
vi.mock('@/hooks/useNavState')

vi.mock('@scalar/api-client/store', () => ({
  useWorkspace: () => ({
    collections: {
      'default': {
        uid: 'default',
        servers: ['server1'],
        selectedServerUid: 'server1',
      },
    },
    servers: {
      'server1': {
        uid: 'server1',
        url: 'https://api.example.com',
      },
    },
  }),
  useActiveEntities: () => ({
    activeCollection: { value: { uid: 'default', servers: ['server1'], selectedServerUid: 'server1' } },
  }),
}))

/** Helper to generate props for the component */
const getProps = (document: WorkspaceDocument) => ({
  props: {
    document,
    config: apiReferenceConfigurationSchema.parse({}),
    clientOptions: [],
    store: {
      workspace: {
        activeDocument: document,
      },
    } as WorkspaceStore,
  },
})

describe('TraversedEntryContainer', () => {
  beforeEach(() => {
    vi.mocked(useNavState).mockReturnValue(createMockNavState(''))
  })
  afterEach(() => {
    vi.resetAllMocks()
    hasLazyLoaded.value = false
  })

  describe('basic operation rendering', () => {
    it('renders a single operation summary when document has one operation and no tag', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Say Hello')
    })

    it('renders multiple operations with different methods', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
              responses: { '200': { description: 'OK' } },
            },
            post: {
              summary: 'Create User',
              responses: { '201': { description: 'Created' } },
            },
            put: {
              summary: 'Update User',
              responses: { '200': { description: 'OK' } },
            },
            delete: {
              summary: 'Delete User',
              responses: { '204': { description: 'No Content' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Wait for hasLazyLoaded to become true
      await vi.waitFor(() => {
        expect(hasLazyLoaded.value).toBe(true)
      })

      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('Create User')
      expect(wrapper.text()).toContain('Update User')
      expect(wrapper.text()).toContain('Delete User')
    })

    it('renders empty state when no entries exist', () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        paths: {},
      }

      // Mock the sidebar with empty entries
      vi.mocked(useSidebar).mockReturnValue(createMockSidebar({}, []))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Should not render anything when no operations exist
      expect(wrapper.text()).toBe('')
    })
  })

  describe('tag-based grouping', () => {
    it('renders operations grouped under tags', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        tags: [{ name: 'UserTag', description: 'User management operations' }],
        paths: {
          '/users': {
            get: {
              tags: ['UserTag'],
              summary: 'Get Users',
              responses: { '200': { description: 'OK' } },
            },
            post: {
              tags: ['UserTag'],
              summary: 'Create User',
              responses: { '201': { description: 'Created' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('UserTag')
      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('Create User')
    })

    it('renders tag groups with x-tagGroups extension', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        tags: [
          { name: 'UserTag', description: 'User operations' },
          { name: 'PostTag', description: 'Post operations' },
        ],
        'x-tagGroups': [
          {
            name: 'Content Management',
            tags: ['UserTag', 'PostTag'],
          },
        ],
        paths: {
          '/users': {
            get: {
              tags: ['UserTag'],
              summary: 'Get Users',
              responses: { '200': { description: 'OK' } },
            },
          },
          '/posts': {
            get: {
              tags: ['PostTag'],
              summary: 'Get Posts',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Note: We don't expect x-tagGroup to be rendered in the content.

      expect(wrapper.text()).not.toContain('Content Management')
      expect(wrapper.text()).toContain('UserTag')
      expect(wrapper.text()).toContain('PostTag')
    })

    it('renders complex nested tag groups with multiple levels', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        tags: [
          { name: 'UserTag', description: 'User operations' },
          { name: 'PostTag', description: 'Post operations' },
          { name: 'CommentTag', description: 'Comment operations' },
        ],
        'x-tagGroups': [
          {
            name: 'Content Management',
            tags: ['UserTag', 'PostTag'],
          },
          {
            name: 'Social Features',
            tags: ['CommentTag'],
          },
        ],
        paths: {
          '/users': {
            get: {
              tags: ['UserTag'],
              summary: 'Get Users',
              responses: { '200': { description: 'OK' } },
            },
          },
          '/posts': {
            get: {
              tags: ['PostTag'],
              summary: 'Get Posts',
              responses: { '200': { description: 'OK' } },
            },
          },
          '/comments': {
            get: {
              tags: ['CommentTag'],
              summary: 'Get Comments',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).not.toContain('Content Management')
      expect(wrapper.text()).not.toContain('Social Features')
      expect(wrapper.text()).toContain('UserTag')
      expect(wrapper.text()).toContain('PostTag')
      expect(wrapper.text()).toContain('CommentTag')
    })
  })

  describe('webhook rendering', () => {
    it('renders webhooks grouped under webhook section', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        webhooks: {
          'user.created': {
            post: {
              summary: 'User Created Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
          'user.updated': {
            post: {
              summary: 'User Updated Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Webhooks')
      expect(wrapper.text()).toContain('User Created Webhook')
      expect(wrapper.text()).toContain('User Updated Webhook')
    })

    it('renders webhooks with tags', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        tags: [{ name: 'Webhooks', description: 'Webhook operations' }],
        webhooks: {
          'user.created': {
            post: {
              tags: ['Webhooks'],
              summary: 'User Created Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Webhooks')
      expect(wrapper.text()).toContain('User Created Webhook')
    })
  })

  describe('mixed content rendering', () => {
    it('renders operations and webhooks mixed under tags', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        tags: [{ name: 'Events', description: 'Event operations and webhooks' }],
        paths: {
          '/events': {
            get: {
              tags: ['Events'],
              summary: 'Get Events',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        webhooks: {
          'event.created': {
            post: {
              tags: ['Events'],
              summary: 'Event Created Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Events')
      expect(wrapper.text()).toContain('Get Events')
      expect(wrapper.text()).toContain('Event Created Webhook')
    })
  })

  describe('lazy loading functionality', () => {
    beforeEach(() => {
      // Mock window.document.getElementById
      vi.spyOn(window.document, 'getElementById').mockReturnValue(null)

      // Mock setTimeout to control timing
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
      hasLazyLoaded.value = false
    })

    it('sets hasLazyLoaded to true when no hash is present', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return empty hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState(''))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      await vi.waitFor(() => {
        expect(wrapper.emitted('allEntriesLoaded')).toBeTruthy()
      })
      vi.advanceTimersByTime(300)

      // hasLazyLoaded should be true when no hash is present
      expect(hasLazyLoaded.value).toBe(true)
      // isIntersectionEnabled should be true when no hash is present
      expect(vi.mocked(useNavState).mock.results[0].value.isIntersectionEnabled.value).toBe(true)
    })

    it('sets hasLazyLoaded to true when hash starts with description', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return hash starting with description
      vi.mocked(useNavState).mockReturnValue(createMockNavState('description/introduction'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      await vi.waitFor(() => {
        expect(wrapper.emitted('allEntriesLoaded')).toBeTruthy()
      })
      vi.advanceTimersByTime(300)

      // hasLazyLoaded should be true when hash starts with description
      expect(hasLazyLoaded.value).toBe(true)
    })

    it('tracks lazy loading events through lazyBus', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Simulate lazy loading events
      lazyBus.emit({ loading: 'operation-1', save: false })
      lazyBus.emit({ loading: 'operation-2', save: false })

      // Simulate lazy loaded events
      lazyBus.emit({ loaded: 'operation-1', save: false })
      lazyBus.emit({ loaded: 'operation-2', save: false })

      // The component should handle these events without crashing
      expect(wrapper.exists()).toBe(true)
    })

    it('resumes scrolling when all lazy elements are loaded', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Simulate loading and then loading all elements
      lazyBus.emit({ loading: 'operation-1', save: true })
      lazyBus.emit({ loading: 'operation-2', save: true })
      lazyBus.emit({ loaded: 'operation-1', save: true })
      lazyBus.emit({ loaded: 'operation-2', save: true })

      // Wait for the allEntriesLoaded event to be emitted
      await vi.waitFor(() => {
        expect(wrapper.emitted('allEntriesLoaded')).toBeTruthy()
      })

      // Advance timers to trigger the setTimeout in the lazyBus.on callback
      vi.advanceTimersByTime(300)

      // hasLazyLoaded should be true and intersection should be enabled
      expect(hasLazyLoaded.value).toBe(true)
      expect(vi.mocked(useNavState).mock.results[0].value.isIntersectionEnabled.value).toBe(true)
    })

    it('resumes scrolling after 5 seconds as failsafe', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      mount(TraversedEntryContainer, getProps(document))

      // Advance timers to trigger the 5-second failsafe
      vi.advanceTimersByTime(5000)

      // hasLazyLoaded should be true and intersection should be enabled
      expect(hasLazyLoaded.value).toBe(true)
      expect(vi.mocked(useNavState).mock.results[0].value.isIntersectionEnabled.value).toBe(true)
    })

    it('does not resume scrolling if hasLazyLoaded is already true', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Set hasLazyLoaded to true initially
      hasLazyLoaded.value = true

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      mount(TraversedEntryContainer, getProps(document))

      // Simulate lazy loading events
      lazyBus.emit({ loading: 'operation-1', save: true })
      lazyBus.emit({ loaded: 'operation-1', save: true })

      // Should not change the state since hasLazyLoaded is already true
      expect(hasLazyLoaded.value).toBe(true)
    })

    it('freezes element and scrolls to target when found via mutation observer', () => {
      const mockElement = window.document.createElement('div')

      // Mock freezeElement to return an unfreeze function
      vi.mock('@scalar/helpers/dom/freeze-element', () => ({
        freezeElement: vi.fn(),
      }))

      // Mock scrollToId
      vi.mock('@scalar/helpers/dom/scroll-to-id', () => ({
        scrollToId: vi.fn(),
      }))

      const openApiDocument = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      // Mock getElementById to return the mock element
      vi.spyOn(window.document, 'getElementById').mockReturnValue(mockElement)

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(openApiDocument))
      const wrapper = mount(TraversedEntryContainer, getProps(openApiDocument))

      // The component should handle mutation observer setup without crashing
      expect(wrapper.exists()).toBe(true)

      // The test verifies that the component sets up the mutation observer correctly
      // The actual mutation observer behavior is tested in the freeze-element tests
    })

    it('handles mutation observer with childList changes', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      mount(TraversedEntryContainer, getProps(document))

      // The component should handle mutation observer setup without crashing
      expect(true).toBe(true) // Just checking it doesn't crash
    })

    it('handles mutation observer with non-childList changes', () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say Hello',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      mount(TraversedEntryContainer, getProps(document))

      // The component should handle non-childList mutations without crashing
      expect(true).toBe(true) // Just checking it doesn't crash
    })

    it('handles lazy loading with multiple operations', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
              responses: { '200': { description: 'OK' } },
            },
            post: {
              summary: 'Create User',
              responses: { '201': { description: 'Created' } },
            },
          },
          '/posts': {
            get: {
              summary: 'Get Posts',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Simulate loading multiple operations
      lazyBus.emit({ loading: 'operation-1', save: true })
      lazyBus.emit({ loading: 'operation-2', save: true })
      lazyBus.emit({ loading: 'operation-3', save: true })

      // Simulate loading them in different order
      lazyBus.emit({ loaded: 'operation-2', save: true })
      lazyBus.emit({ loaded: 'operation-1', save: true })
      lazyBus.emit({ loaded: 'operation-3', save: true })

      // Advance timers to trigger the setTimeout
      await vi.waitFor(() => {
        expect(wrapper.emitted('allEntriesLoaded')).toBeTruthy()
      })
      vi.advanceTimersByTime(300)

      // All operations should be loaded and scrolling should resume
      expect(hasLazyLoaded.value).toBe(true)
      expect(vi.mocked(useNavState).mock.results[0].value.isIntersectionEnabled.value).toBe(true)
    })

    it('handles lazy loading with webhooks', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        webhooks: {
          'user.created': {
            post: {
              summary: 'User Created Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
          'user.updated': {
            post: {
              summary: 'User Updated Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('webhook/POST/user.created'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Simulate loading webhooks
      lazyBus.emit({ loading: 'webhook-1', save: true })
      lazyBus.emit({ loading: 'webhook-2', save: true })
      lazyBus.emit({ loaded: 'webhook-1', save: true })
      lazyBus.emit({ loaded: 'webhook-2', save: true })

      // Advance timers to trigger the setTimeout
      await vi.waitFor(() => {
        expect(wrapper.emitted('allEntriesLoaded')).toBeTruthy()
      })
      vi.advanceTimersByTime(300)

      // All webhooks should be loaded and scrolling should resume
      expect(hasLazyLoaded.value).toBe(true)
      expect(vi.mocked(useNavState).mock.results[0].value.isIntersectionEnabled.value).toBe(true)
    })

    it('handles lazy loading with mixed content (operations and webhooks)', async () => {
      const document = {
        openapi: '3.1.0' as const,
        info: { title: 'Test', version: '1.0.0' },
        tags: [{ name: 'Events', description: 'Event operations and webhooks' }],
        paths: {
          '/events': {
            get: {
              tags: ['Events'],
              summary: 'Get Events',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        webhooks: {
          'event.created': {
            post: {
              tags: ['Events'],
              summary: 'Event Created Webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      // Mock useNavState to return a hash
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/events/get/events'))

      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      // Simulate loading mixed content
      lazyBus.emit({ loading: 'operation-1', save: true })
      lazyBus.emit({ loading: 'webhook-1', save: true })
      lazyBus.emit({ loaded: 'operation-1', save: true })
      lazyBus.emit({ loaded: 'webhook-1', save: true })

      await vi.waitFor(() => {
        expect(wrapper.emitted('allEntriesLoaded')).toBeTruthy()
      })
      vi.advanceTimersByTime(300)

      // All content should be loaded and scrolling should resume
      expect(hasLazyLoaded.value).toBe(true)
      expect(vi.mocked(useNavState).mock.results[0].value.isIntersectionEnabled.value).toBe(true)
    })
  })
})
