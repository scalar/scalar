import { collectionSchema, serverSchema } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { TraversedEntry, TraversedOperation, TraversedTag } from '@/features/traverse-schema'
import type { TraversedWebhook } from '@/features/traverse-schema/types'

import TraversedEntryComponent from './TraversedEntry.vue'

describe('TraversedEntry', () => {
  const mockDocument: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
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
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').text()).toBe('/users get operation-1')
    })

    it('renders multiple operations correctly', () => {
      const operations: TraversedEntry[] = [
        createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users', method: 'get' }),
        createMockOperation({ id: 'op-2', title: 'Create User', path: '/users', method: 'post' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries: operations,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      const operationElements = wrapper.findAll('[data-testid="operation"]')
      expect(operationElements).toHaveLength(2)
      expect(operationElements[0].text()).toBe('/users get op-1')
      expect(operationElements[1].text()).toBe('/users post op-2')
    })
  })

  describe('webhook rendering', () => {
    it('renders a single webhook correctly', () => {
      const webhook = createMockWebhook()
      const entries: TraversedEntry[] = [webhook]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(true)
      // Webhooks use name instead of path
      expect(wrapper.find('[data-testid="operation"]').text()).toBe('user.created POST webhook-1')
    })

    it('renders multiple webhooks correctly', () => {
      const webhooks: TraversedEntry[] = [
        createMockWebhook({ id: 'webhook-1', name: 'user.created', method: 'post' }),
        createMockWebhook({ id: 'webhook-2', name: 'user.updated', method: 'put' }),
      ]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries: webhooks,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      const operationElements = wrapper.findAll('[data-testid="operation"]')
      expect(operationElements).toHaveLength(2)
      expect(operationElements[0].text()).toBe('user.created post webhook-1')
      expect(operationElements[1].text()).toBe('user.updated put webhook-2')
    })
  })

  describe('tag rendering', () => {
    it('renders a regular tag correctly', () => {
      const tag = createMockTag()
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ tag.title }} <slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tag"]').text()).toBe('Users')
    })

    it('renders tag with children correctly', () => {
      const tag = createMockTag({
        children: [createMockOperation({ id: 'child-op-1', title: 'Get Users', path: '/users', method: 'get' })],
      })
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').text()).toBe('/users get child-op-1')
    })

    it('does not render tag when it has no children', () => {
      const tag = createMockTag({ children: [] })
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ tag.title }} <slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(false)
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
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      // Tag groups render their children directly without a Tag wrapper
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').text()).toBe('/users get group-op-1')
    })

    it('renders empty tag group correctly', () => {
      const tagGroup = createMockTagGroup({ children: [] })
      const entries: TraversedEntry[] = [tagGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      // Empty tag groups should not render anything
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(false)
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
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tag"]').text()).toBe('Webhooks')
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').text()).toBe('user.created post group-webhook-1')
    })

    it('renders empty webhook group correctly', () => {
      const webhookGroup = createMockWebhookGroup({ children: [] })
      const entries: TraversedEntry[] = [webhookGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ tag.title }} <slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(false)
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
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      const operationElements = wrapper.findAll('[data-testid="operation"]')
      expect(operationElements).toHaveLength(3)
      expect(operationElements[0].text()).toBe('/users get op-1')
      expect(operationElements[1].text()).toBe('user.created post webhook-1')
      expect(operationElements[2].text()).toBe('/users post tag-op-1')

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tag"]').text()).toBe('Users')
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
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ moreThanOneTag }}</div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      const tagElements = wrapper.findAll('[data-testid="tag"]')
      expect(tagElements).toHaveLength(2)
      expect(tagElements[0].text()).toBe('true')
      expect(tagElements[1].text()).toBe('true')
    })

    it('passes moreThanOneTag as false when only one tag exists', () => {
      const entries: TraversedEntry[] = [createMockTag({ id: 'tag-1', title: 'Users' })]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ moreThanOneTag }}</div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      const tagElement = wrapper.find('[data-testid="tag"]')
      expect(tagElement.exists()).toBe(true)
      expect(tagElement.text()).toBe('false')
    })
  })

  describe('edge cases', () => {
    it('handles empty entries array', () => {
      const entries: TraversedEntry[] = []

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(false)
    })

    it('handles undefined children in tag', () => {
      const tag = createMockTag({ children: undefined as any })
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ tag.title }} <slot /></div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="tag"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(false)
    })

    it('handles undefined children in tag group', () => {
      const tagGroup = createMockTagGroup({ children: undefined as any })
      const entries: TraversedEntry[] = [tagGroup]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      expect(wrapper.find('[data-testid="operation"]').exists()).toBe(false)
    })
  })

  describe('props passing', () => {
    it('passes correct props to Operation component', () => {
      const operation = createMockOperation()
      const entries: TraversedEntry[] = [operation]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
      })

      const operationElement = wrapper.find('[data-testid="operation"]')
      expect(operationElement.text()).toBe('/users get operation-1 modern test-collection server1')
    })

    it('passes correct props to Tag component', () => {
      const tag = createMockTag()
      const entries: TraversedEntry[] = [tag]

      const wrapper = mount(TraversedEntryComponent, {
        props: {
          entries,
          document: mockDocument,
          config: mockConfig,
          activeCollection: mockCollection,
          activeServer: mockServer,
        },
        global: {
          stubs: {
            Tag: {
              template: '<div data-testid="tag">{{ tag.title }} {{ layout }} {{ moreThanOneTag }}</div>',
              props: ['tag', 'layout', 'moreThanOneTag'],
            },
          },
        },
      })

      const tagElement = wrapper.find('[data-testid="tag"]')
      expect(tagElement.text()).toBe('Users modern false')
    })
  })
})
