import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TraversedEntryContainer from './TraversedEntryContainer.vue'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createMockSidebar, createMockSidebarFromDocument } from '@/helpers/test-utils'
import { useSidebar } from '@/features/sidebar'
import { apiReferenceConfigurationSchema, type OpenAPIV3_1 } from '@scalar/types'

// Mock the sidebar module
vi.mock('@/features/sidebar')

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
const getProps = (document: OpenAPIV3_1.Document) => ({
  props: {
    document,
    config: apiReferenceConfigurationSchema.parse({
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    }),
    store: {
      workspace: {
        activeDocument: document,
      },
    } as unknown as WorkspaceStore,
  },
})

describe('TraversedEntryContainer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('basic operation rendering', () => {
    it('renders a single operation summary when document has one operation and no tag', () => {
      const document = {
        openapi: '3.1.0',
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
      } as const

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Say Hello')
    })

    it('renders multiple operations with different methods', () => {
      const document = {
        openapi: '3.1.0',
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
      } as const

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

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
      } as const

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
        openapi: '3.1.0',
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
      } as const

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('UserTag')
      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('Create User')
    })

    it('renders tag groups with x-tagGroups extension', () => {
      const document = {
        openapi: '3.1.0',
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
      } as const

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
        openapi: '3.1.0',
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
      } as const

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
        openapi: '3.1.0',
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
      } as const

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Webhooks')
      expect(wrapper.text()).toContain('User Created Webhook')
      expect(wrapper.text()).toContain('User Updated Webhook')
    })

    it('renders webhooks with tags', () => {
      const document = {
        openapi: '3.1.0',
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
      } as const

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
        openapi: '3.1.0',
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
      } as const

      // Mock the sidebar with the correct entries for this document
      vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
      const wrapper = mount(TraversedEntryContainer, getProps(document))

      expect(wrapper.text()).toContain('Events')
      expect(wrapper.text()).toContain('Get Events')
      expect(wrapper.text()).toContain('Event Created Webhook')
    })
  })

  describe('sorting configuration', () => {
    describe('tagsSorter', () => {
      it('sorts tags alphabetically when using alpha option', () => {
        const document = {
          openapi: '3.1.0',
          info: {
            title: 'Test',
            version: '1.0.0',
          },
          tags: [
            { name: 'Zebra', description: 'Zebra operations' },
            { name: 'Alpha', description: 'Alpha operations' },
            { name: 'Beta', description: 'Beta operations' },
          ],
          paths: {
            '/zebra': {
              get: {
                tags: ['Zebra'],
                summary: 'Get Zebra',
                responses: { '200': { description: 'OK' } },
              },
            },
            '/alpha': {
              get: {
                tags: ['Alpha'],
                summary: 'Get Alpha',
                responses: { '200': { description: 'OK' } },
              },
            },
            '/beta': {
              get: {
                tags: ['Beta'],
                summary: 'Get Beta',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        } as const

        // Mock the sidebar with the correct entries for this document
        vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
        const wrapper = mount(TraversedEntryContainer, getProps(document))

        const text = wrapper.text()
        const alphaIndex = text.indexOf('Alpha')
        const betaIndex = text.indexOf('Beta')
        const zebraIndex = text.indexOf('Zebra')

        // Verify alphabetical order: Alpha, Beta, Zebra
        expect(alphaIndex).toBeLessThan(betaIndex)
        expect(betaIndex).toBeLessThan(zebraIndex)
      })

      it('sorts tags in reverse alphabetical order with custom function', () => {
        const document = {
          openapi: '3.1.0',
          info: {
            title: 'Test',
            version: '1.0.0',
          },
          tags: [
            { name: 'Alpha', description: 'Alpha operations' },
            { name: 'Beta', description: 'Beta operations' },
            { name: 'Zebra', description: 'Zebra operations' },
          ],
          paths: {
            '/alpha': {
              get: {
                tags: ['Alpha'],
                summary: 'Get Alpha',
                responses: { '200': { description: 'OK' } },
              },
            },
            '/beta': {
              get: {
                tags: ['Beta'],
                summary: 'Get Beta',
                responses: { '200': { description: 'OK' } },
              },
            },
            '/zebra': {
              get: {
                tags: ['Zebra'],
                summary: 'Get Zebra',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        } as const

        // Mock the sidebar with the correct entries for this document
        vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
        const props = getProps(document)
        props.props.config.tagsSorter = (a: { name: string }, b: { name: string }) => -a.name.localeCompare(b.name)
        const wrapper = mount(TraversedEntryContainer, props)

        const text = wrapper.text()
        const alphaIndex = text.indexOf('Alpha')
        const betaIndex = text.indexOf('Beta')
        const zebraIndex = text.indexOf('Zebra')

        // Verify reverse alphabetical order: Zebra, Beta, Alpha
        expect(zebraIndex).toBeLessThan(betaIndex)
        expect(betaIndex).toBeLessThan(alphaIndex)
      })
    })

    describe('operationsSorter', () => {
      it('sorts operations alphabetically when using alpha option', () => {
        const document = {
          openapi: '3.1.0',
          info: {
            title: 'Test',
            version: '1.0.0',
          },
          tags: [{ name: 'TestTag', description: 'Test operations' }],
          paths: {
            '/zebra': {
              get: {
                tags: ['TestTag'],
                summary: 'Get Zebra',
                responses: { '200': { description: 'OK' } },
              },
            },
            '/alpha': {
              get: {
                tags: ['TestTag'],
                summary: 'Get Alpha',
                responses: { '200': { description: 'OK' } },
              },
            },
            '/beta': {
              get: {
                tags: ['TestTag'],
                summary: 'Get Beta',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        } as const

        // Mock the sidebar with the correct entries for this document
        vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
        const wrapper = mount(TraversedEntryContainer, getProps(document))

        const text = wrapper.text()
        const alphaIndex = text.indexOf('Get Alpha')
        const betaIndex = text.indexOf('Get Beta')
        const zebraIndex = text.indexOf('Get Zebra')

        // Verify alphabetical order: Get Alpha, Get Beta, Get Zebra
        expect(alphaIndex).toBeLessThan(betaIndex)
        expect(betaIndex).toBeLessThan(zebraIndex)
      })

      it('sorts operations by HTTP method with custom function', () => {
        const document = {
          openapi: '3.1.0',
          info: {
            title: 'Test',
            version: '1.0.0',
          },
          tags: [{ name: 'TestTag', description: 'Test operations' }],
          paths: {
            '/users': {
              delete: {
                tags: ['TestTag'],
                summary: 'Delete User',
                responses: { '204': { description: 'No Content' } },
              },
              get: {
                tags: ['TestTag'],
                summary: 'Get User',
                responses: { '200': { description: 'OK' } },
              },
              post: {
                tags: ['TestTag'],
                summary: 'Create User',
                responses: { '201': { description: 'Created' } },
              },
              put: {
                tags: ['TestTag'],
                summary: 'Update User',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        } as const

        // Mock the sidebar with the correct entries for this document
        vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
        const props = getProps(document)

        // Custom sorter
        props.props.config.operationsSorter = (
          a: { method: string; path: string },
          b: { method: string; path: string },
        ) => {
          const methodOrder = ['get', 'post', 'put', 'delete']
          const methodComparison = methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method)

          if (methodComparison !== 0) {
            return methodComparison
          }

          return a.path.localeCompare(b.path)
        }

        const wrapper = mount(TraversedEntryContainer, props)

        const text = wrapper.text()
        const getIndex = text.indexOf('Get User')
        const postIndex = text.indexOf('Create User')
        const putIndex = text.indexOf('Update User')
        const deleteIndex = text.indexOf('Delete User')

        // Verify method order: GET, POST, PUT, DELETE
        expect(getIndex).toBeLessThan(postIndex)
        expect(postIndex).toBeLessThan(putIndex)
        expect(putIndex).toBeLessThan(deleteIndex)
      })

      it('sorts operations by method when using a custom function', () => {
        const document = {
          openapi: '3.1.0',
          info: {
            title: 'Test',
            version: '1.0.0',
          },
          tags: [{ name: 'TestTag', description: 'Test operations' }],
          paths: {
            '/users': {
              delete: {
                tags: ['TestTag'],
                summary: 'Delete User',
                responses: { '204': { description: 'No Content' } },
              },
              get: {
                tags: ['TestTag'],
                summary: 'Get User',
                responses: { '200': { description: 'OK' } },
              },
              post: {
                tags: ['TestTag'],
                summary: 'Create User',
                responses: { '201': { description: 'Created' } },
              },
              put: {
                tags: ['TestTag'],
                summary: 'Update User',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        } as const

        // Mock the sidebar with the correct entries for this document
        vi.mocked(useSidebar).mockReturnValue(createMockSidebarFromDocument(document))
        const props = getProps(document)

        // Custom sorter
        props.props.config.operationsSorter = (
          a: { method: string; path: string },
          b: { method: string; path: string },
        ) => {
          const methodOrder = ['get', 'post', 'put', 'delete']
          const methodComparison = methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method)
          if (methodComparison !== 0) {
            return methodComparison
          }
          return a.path.localeCompare(b.path)
        }

        const wrapper = mount(TraversedEntryContainer, props)

        const text = wrapper.text()
        const getIndex = text.indexOf('Get User')
        const postIndex = text.indexOf('Create User')
        const putIndex = text.indexOf('Update User')
        const deleteIndex = text.indexOf('Delete User')

        // Verify method order: GET, POST, PUT, DELETE
        expect(getIndex).toBeLessThan(postIndex)
        expect(postIndex).toBeLessThan(putIndex)
        expect(putIndex).toBeLessThan(deleteIndex)
      })
    })
  })
})
