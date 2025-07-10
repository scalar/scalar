import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OperationsSection from './OperationsSection.vue'

let mockCollapsedSidebarItems: Record<string, boolean> = {}

vi.mock('@/features/sidebar', () => ({
  useSidebar: () => ({
    scrollToOperation: vi.fn(),
    collapsedSidebarItems: mockCollapsedSidebarItems,
    toggleCollapsedSidebarItem: vi.fn(),
    setCollapsedSidebarItem: vi.fn(),
    items: {
      entries: [],
      titles: new Map(),
    },
  }),
}))

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

function createConfiguration(config: Partial<ApiReferenceConfiguration> = {}): ApiReferenceConfiguration {
  return apiReferenceConfigurationSchema.parse(config)
}

describe('OperationsSection', () => {
  beforeEach(() => {
    // Reset the mock to have all sections expanded by default
    mockCollapsedSidebarItems = {}
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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration({
            tagsSorter: 'alpha',
          }),
        },
      })

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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
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
      } as const

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

      // Note: We don't expect x-tagGroup to be rendered in the content.

      expect(wrapper.text()).toContain('UserTag')
      expect(wrapper.text()).toContain('PostTag')
      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('Get Posts')
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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

      // Note: We don't expect x-tagGroup to be rendered in the content.

      expect(wrapper.text()).toContain('UserTag')
      expect(wrapper.text()).toContain('PostTag')
      expect(wrapper.text()).toContain('CommentTag')
      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('Get Posts')
      expect(wrapper.text()).toContain('Get Comments')
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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

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

      const wrapper = mount(OperationsSection, {
        props: {
          document,
          config: createConfiguration(),
        },
      })

      expect(wrapper.text()).toContain('Events')
      expect(wrapper.text()).toContain('Get Events')
      expect(wrapper.text()).toContain('Event Created Webhook')
    })
  })
})
