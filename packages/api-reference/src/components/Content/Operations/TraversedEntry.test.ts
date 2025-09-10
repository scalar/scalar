import { collectionSchema, serverSchema } from '@scalar/oas-utils/entities/spec'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { TraversedEntry, TraversedOperation, TraversedTag } from '@/features/traverse-schema'
import type { TraversedWebhook } from '@/features/traverse-schema/types'
import { createMockNavState, createMockPluginManager, createMockSidebar } from '@/helpers/test-utils'
import { useNavState } from '@/hooks/useNavState'

import TraversedEntryComponent from './TraversedEntry.vue'

vi.mock('@/features/sidebar', () => ({ useSidebar: vi.fn(() => createMockSidebar()) }))
vi.mock('@/hooks/useNavState', () => ({ useNavState: vi.fn(() => createMockNavState('')) }))
vi.mock('@/plugins/hooks/usePluginManager', () => ({ usePluginManager: () => createMockPluginManager() }))

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

describe('TraversedEntry', async () => {
  const mockDocument = {
    openapi: '3.1.0' as const,
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users': {
        get: {
          tags: ['users'],
          summary: 'Get Users',
          responses: { '200': { description: 'OK' } },
        },
        post: {
          tags: ['users'],
          summary: 'Create User',
          responses: { '201': { description: 'Created' } },
        },
      },
      '/planets': {
        get: {
          tags: ['planets'],
          summary: 'Get Planets',
          responses: { '200': { description: 'OK' } },
        },
        post: {
          tags: ['planets'],
          summary: 'Create Planet',
          responses: { '201': { description: 'Created' } },
        },
      },
    },
    webhooks: {
      'user.created': {
        post: {
          summary: 'User Created',
          responses: { '200': { description: 'OK' } },
        },
      },
      'user.updated': {
        put: {
          summary: 'User Updated',
          responses: { '200': { description: 'OK' } },
        },
      },
    },
    tags: [
      {
        name: 'users',
        description: 'User management operations',
      },
      {
        name: 'planets',
        description: 'Planet management operations',
      },
    ],
    components: {
      schemas: {},
    },
  }

  const mockConfig = apiReferenceConfigurationSchema.parse({
    layout: 'modern',
    theme: 'default',
    hideModels: false,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  })

  const mockCollection = collectionSchema.parse({
    uid: 'test-collection',
    name: 'Test Collection',
    servers: ['server1'],
    selectedServerUid: 'server1',
  })

  const mockServer = serverSchema.parse({
    uid: 'server1',
    name: 'Test Server',
    url: 'https://api.example.com',
  })

  // Mock WorkspaceStore with documents
  const mockStore = createWorkspaceStore({
    meta: {
      'x-scalar-active-document': 'default',
    },
  })

  await mockStore.addDocument({
    name: 'default',
    document: mockDocument,
  })

  const createMockOperation = (overrides: Partial<TraversedOperation> = {}): TraversedOperation => ({
    id: 'operation-1',
    title: 'Get Users',
    method: 'get',
    path: '/users',
    operation: {
      summary: 'Get Users',
      responses: { '200': { description: 'OK' } },
    },
    ...overrides,
  })

  const createMockWebhook = (overrides: Partial<TraversedWebhook> = {}): TraversedWebhook => ({
    id: 'webhook-1',
    title: 'User Created',
    method: 'post',
    name: 'user.created',
    webhook: {
      summary: 'User Created',
      responses: { '200': { description: 'OK' } },
    },
    ...overrides,
  })

  const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    id: 'tag-1',
    title: 'Users',
    children: [],
    tag: {
      name: 'users',
      description: 'User management operations',
    },
    isGroup: false,
    ...overrides,
  })

  const createMockTagGroup = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    id: 'tag-group-1',
    title: 'Content Management',
    children: [],
    tag: {
      name: 'content-management',
      description: 'Content management operations',
    },
    isGroup: true,
    ...overrides,
  })

  const createMockWebhookGroup = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    id: 'webhook-group-1',
    title: 'Webhooks',
    children: [],
    tag: {
      name: 'webhooks',
      description: 'Webhook operations',
    },
    isGroup: false,
    isWebhooks: true,
    ...overrides,
  })

  describe('operation rendering', () => {
    it('renders a single operation correctly', () => {
      const operation = createMockOperation()
      const entries: TraversedEntry[] = [operation]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      // Check that Operation component is rendered
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Get Users')
    })

    it('renders multiple operations correctly', () => {
      const operations: TraversedEntry[] = [
        createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users', method: 'get' }),
        createMockOperation({ id: 'op-2', title: 'Create User', path: '/users', method: 'post' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries: operations,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const operationComponents = wrapper.findAllComponents({ name: 'Operation' })
      expect(operationComponents).toHaveLength(2)
      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('Create User')
    })
  })

  describe('webhook rendering', () => {
    it('renders a single webhook correctly', () => {
      const webhook = createMockWebhook()
      const entries: TraversedEntry[] = [webhook]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      // Check that Operation component is rendered for webhooks
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('User Created')
    })

    it('renders multiple webhooks correctly', () => {
      const webhooks: TraversedEntry[] = [
        createMockWebhook({ id: 'webhook-1', name: 'user.created', method: 'post' }),
        createMockWebhook({ id: 'webhook-2', name: 'user.updated', method: 'put' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries: webhooks,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const operationComponents = wrapper.findAllComponents({ name: 'Operation' })
      expect(operationComponents).toHaveLength(2)
      expect(wrapper.text()).toContain('User Created')
      expect(wrapper.text()).toContain('User Updated')
    })
  })

  describe('tag rendering', () => {
    it('renders a regular tag correctly', () => {
      const tag = createMockTag()
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      // Check that Tag component is rendered
      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Users')
    })

    it('renders tag with children correctly', () => {
      const tag = createMockTag({
        children: [createMockOperation({ id: 'child-op-1', title: 'Get Users', path: '/users', method: 'get' })],
      })
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Get Users')
    })

    it('does not render tag when it has no children', () => {
      const tag = createMockTag({ children: [] })
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
    })
  })

  describe('tag group rendering', () => {
    it('renders tag group correctly', () => {
      const tagGroup = createMockTagGroup({
        children: [createMockOperation({ id: 'group-op-1', title: 'Get Users', path: '/users', method: 'get' })],
      })
      const entries: TraversedEntry[] = [tagGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      // Tag groups render their children directly without a Tag wrapper
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Get Users')
    })

    it('renders empty tag group correctly', () => {
      const tagGroup = createMockTagGroup({ children: [] })
      const entries: TraversedEntry[] = [tagGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      // Empty tag groups should not render anything
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
    })
  })

  describe('webhook group rendering', () => {
    it('renders webhook group correctly', () => {
      const webhookGroup = createMockWebhookGroup({
        children: [createMockWebhook({ id: 'group-webhook-1', name: 'user.created', method: 'post' })],
      })
      const entries: TraversedEntry[] = [webhookGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('User Created')
    })

    it('renders empty webhook group correctly', () => {
      const webhookGroup = createMockWebhookGroup({ children: [] })
      const entries: TraversedEntry[] = [webhookGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
    })
  })

  describe('mixed entry types', () => {
    it('renders mixed entry types correctly', () => {
      const entries: TraversedEntry[] = [
        createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users', method: 'get' }),
        createMockWebhook({ id: 'webhook-1', name: 'user.created', method: 'post' }),
        createMockTag({
          id: 'tag-1',
          title: 'Users',
          children: [createMockOperation({ id: 'tag-op-1', title: 'Create User', path: '/users', method: 'post' })],
        }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const operationComponents = wrapper.findAllComponents({ name: 'Operation' })
      expect(operationComponents).toHaveLength(3)
      expect(wrapper.text()).toContain('Get Users')
      expect(wrapper.text()).toContain('User Created')
      expect(wrapper.text()).toContain('Create User')

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.text()).toContain('Users')
    })
  })

  describe('moreThanOneTag prop', () => {
    it('passes moreThanOneTag as true when multiple tags exist', () => {
      const entries: TraversedEntry[] = [
        createMockTag({ id: 'tag-1', title: 'Users' }),
        createMockTag({ id: 'tag-2', title: 'Posts' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const tagComponents = wrapper.findAllComponents({ name: 'Tag' })
      expect(tagComponents).toHaveLength(2)

      // Check that moreThanOneTag prop is passed correctly
      tagComponents.forEach((tagComponent) => {
        expect(tagComponent.props('moreThanOneTag')).toBe(true)
      })
    })

    it('passes moreThanOneTag as false when only one tag exists', () => {
      const entries: TraversedEntry[] = [createMockTag({ id: 'tag-1', title: 'Users' })]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const tagComponent = wrapper.findComponent({ name: 'Tag' })
      expect(tagComponent.exists()).toBe(true)
      expect(tagComponent.props('moreThanOneTag')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles empty entries array', () => {
      const entries: TraversedEntry[] = []

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
    })

    it('handles undefined children in tag', () => {
      const tag = createMockTag({ children: undefined as any })
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
    })

    it('handles undefined children in tag group', () => {
      const tagGroup = createMockTagGroup({ children: undefined as any })
      const entries: TraversedEntry[] = [tagGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
    })
  })

  describe('props passing', () => {
    it('passes correct props to Operation component', () => {
      const operation = createMockOperation()
      const entries: TraversedEntry[] = [operation]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const operationComponent = wrapper.findComponent({ name: 'Operation' })
      expect(operationComponent.props('path')).toBe('/users')
      expect(operationComponent.props('method')).toBe('get')
      expect(operationComponent.props('id')).toBe('operation-1')
      expect(operationComponent.props('store')).toStrictEqual(mockStore)
      expect(operationComponent.props('server')).toStrictEqual(mockServer)
    })

    it('passes correct props to Tag component', () => {
      const tag = createMockTag()
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const tagComponent = wrapper.findComponent({ name: 'Tag' })
      expect(tagComponent.props('tag')).toEqual(tag)
      expect(tagComponent.props('moreThanOneTag')).toBe(false)
    })
  })

  describe('isLazy method', () => {
    it('returns correct lazy values for different indices', () => {
      // Mock useNavState to return hash matching the first operation
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users/get/users'))

      const entries = [
        createMockTag({
          id: 'tag/users',
          title: 'Users',
          tag: { name: 'users' },
          children: [
            createMockOperation({
              id: 'tag/users/get/users',
              path: '/users',
              method: 'get',
              operation: { summary: 'Get Users' },
            }),
            createMockOperation({
              id: 'tag/users/post/users',
              path: '/users',
              method: 'post',
              operation: { summary: 'Create User' },
            }),
          ],
        }),
        createMockTag({
          id: 'tag/planets',
          title: 'Planets',
          tag: { name: 'planets' },
          children: [
            createMockOperation({
              id: 'tag/planets/get/planets',
              path: '/planets',
              method: 'get',
              operation: { summary: 'Get Planets' },
            }),
            createMockOperation({
              id: 'tag/planets/post/planets',
              path: '/planets',
              method: 'post',
              operation: { summary: 'Create Planet' },
            }),
          ],
        }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const [tag1, tag2] = wrapper.findAllComponents({ name: 'Lazy' })
      expect(tag1.vm.isLazy).toBe(false)
      expect(tag2.vm.isLazy).toBe(true)
    })

    it('returns null for current and nearby indices when hash matches webhook', async () => {
      // Mock useNavState to return hash matching a webhook
      vi.mocked(useNavState).mockReturnValue(createMockNavState('webhook/POST/user.created'))

      const entries = [
        createMockWebhook({ id: 'webhook-1', name: 'user.created', method: 'post' }),
        createMockWebhook({ id: 'webhook-2', name: 'user.updated', method: 'put' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const component = wrapper.vm
      expect(component.isLazy(entries[0], 0)).toBe(null)
      expect(component.isLazy(entries[1], 1)).toBe(null)
    })

    it('returns null for current and nearby indices when hash matches tag', () => {
      // Mock useNavState to return hash matching a tag
      vi.mocked(useNavState).mockReturnValue(createMockNavState('tag/users'))

      const entries = [createMockTag({ id: 'tag-1', title: 'Users' }), createMockTag({ id: 'tag-2', title: 'Posts' })]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 0,
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const component = wrapper.vm
      expect(component.isLazy(entries[0], 0)).toBe(null)
      expect(component.isLazy(entries[1], 1)).toBe(null)
    })

    it('returns correct lazy values for different positions relative to current index', () => {
      // Mock useNavState to return hash matching the second entry
      vi.mocked(useNavState).mockReturnValue(createMockNavState('operation-2'))

      const entries = [
        createMockOperation({ id: 'operation-1', title: 'Get Users' }),
        createMockOperation({ id: 'operation-2', title: 'Create User' }),
        createMockOperation({ id: 'operation-3', title: 'Update User' }),
        createMockOperation({ id: 'operation-4', title: 'Delete User' }),
        createMockOperation({ id: 'operation-5', title: 'List Users' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          rootIndex: 1, // Current index is 1 (operation-2)
          clientOptions: [],
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
          store: mockStore,
        },
      })

      const component = wrapper.vm
      // Index 0 is before current index (1)
      expect(component.isLazy(entries[0], 0)).toBe('prev')
      // Index 1 is current index
      expect(component.isLazy(entries[1], 1)).toBe(null)
      // Index 2 is current + 1
      expect(component.isLazy(entries[2], 2)).toBe(null)
      // Index 3 is current + 2
      expect(component.isLazy(entries[3], 3)).toBe(null)
      // Index 4 is current + 3 (after the 2 sibling limit)
      expect(component.isLazy(entries[4], 4)).toBe('after')
    })
  })
})
