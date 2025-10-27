import { serverSchema } from '@scalar/oas-utils/entities/spec'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type {
  TraversedEntry,
  TraversedOperation,
  TraversedTag,
  TraversedWebhook,
} from '@scalar/workspace-store/schemas/navigation'
import type { ComponentProps } from '@test/utils/types'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import { createMockPluginManager } from '@/helpers/test-utils'

import TraversedEntryComponent from './TraversedEntry.vue'

vi.mock('@/plugins/hooks/usePluginManager', () => ({ usePluginManager: () => createMockPluginManager() }))

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
  security: [],
}

const mockConfig = apiReferenceConfigurationSchema.parse({
  layout: 'modern',
  theme: 'default',
  hideModels: false,
  tagsSorter: 'alpha',
  operationsSorter: 'alpha',
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

const makeMockProps = (entries: TraversedEntry[]): ComponentProps<typeof TraversedEntryComponent> => ({
  entries,
  paths: mockDocument.paths,
  webhooks: mockDocument.webhooks,
  security: mockDocument.security,
  activeServer: mockServer,
  getSecuritySchemes: () => [],
  xScalarDefaultClient: mockStore.workspace['x-scalar-default-client'],
  expandedItems: {},
  schemas: mockDocument.components.schemas,
  options: {
    layout: mockConfig.layout,
    showOperationId: mockConfig.showOperationId,
    hideTestRequestButton: mockConfig.hideTestRequestButton,
    expandAllResponses: mockConfig.expandAllResponses,
    expandAllModelSections: mockConfig.expandAllModelSections,
    orderRequiredPropertiesFirst: mockConfig.orderRequiredPropertiesFirst,
    orderSchemaPropertiesBy: mockConfig.orderSchemaPropertiesBy,
    clientOptions: [],
  },
})

const createMockOperation = (overrides: Partial<TraversedOperation> = {}): TraversedOperation => ({
  type: 'operation',
  id: 'operation-1',
  title: 'Get Users',
  method: 'get',
  path: '/users',
  ref: '#/paths/users/get',
  ...overrides,
})

const createMockWebhook = (overrides: Partial<TraversedWebhook> = {}): TraversedWebhook => ({
  type: 'webhook',
  id: 'webhook-1',
  title: 'User Created',
  method: 'post',
  name: 'user.created',
  ref: '#/webhooks/user.created/post',
  ...overrides,
})

const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
  type: 'tag',
  id: 'tag-1',
  title: 'Users',
  children: [],
  isGroup: false,
  name: 'users',
  ...overrides,
})

const createMockTagGroup = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
  type: 'tag',
  id: 'tag-group-1',
  title: 'Content Management',
  children: [],
  name: 'content-management',
  isGroup: true,
  ...overrides,
})

const createMockWebhookGroup = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
  type: 'tag',
  id: 'webhook-group-1',
  title: 'Webhooks',
  children: [],
  name: 'webhooks',
  isGroup: false,
  isWebhooks: true,
  ...overrides,
})

afterEach(() => {
  vi.clearAllMocks()
})

beforeEach(() => {
  vi.mock('@/components/Lazy/lazyBus', () => ({
    useLazyBus: () => ({
      isReady: computed(() => true),
    }),
  }))
})

describe('operation rendering', () => {
  it('renders a single operation correctly', async () => {
    const operation = createMockOperation()
    const entries: TraversedEntry[] = [operation]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
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
      props: makeMockProps(operations),
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
      props: makeMockProps(entries),
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
      props: makeMockProps(webhooks),
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
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
    })

    expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Get Users')
  })

  it('does not render tag when it has no children', () => {
    const tag = createMockTag({ children: [] })
    const entries: TraversedEntry[] = [tag]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
    })

    // Tag groups render their children directly without a Tag wrapper
    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Get Users')
  })

  it('renders empty tag group correctly', () => {
    const tagGroup = createMockTagGroup({ children: [] })
    const entries: TraversedEntry[] = [tagGroup]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
    })

    expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('User Created')
  })

  it('renders empty webhook group correctly', () => {
    const webhookGroup = createMockWebhookGroup({ children: [] })
    const entries: TraversedEntry[] = [webhookGroup]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
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
      props: makeMockProps(entries),
    })

    expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
  })

  it('handles undefined children in tag', () => {
    const tag = createMockTag({ children: undefined as any })
    const entries: TraversedEntry[] = [tag]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
    })

    expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
  })

  it('handles undefined children in tag group', () => {
    const tagGroup = createMockTagGroup({ children: undefined as any })
    const entries: TraversedEntry[] = [tagGroup]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
    })

    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(false)
  })
})

describe('props passing', () => {
  it('passes correct props to Operation component', () => {
    const operation = createMockOperation()
    const entries: TraversedEntry[] = [operation]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
    })

    const operationComponent = wrapper.findComponent({ name: 'Operation' })
    expect(operationComponent.props('path')).toBe('/users')
    expect(operationComponent.props('method')).toBe('get')
    expect(operationComponent.props('id')).toBe('operation-1')
    expect(operationComponent.props('server')).toStrictEqual(mockServer)
  })

  it('passes correct props to Tag component', () => {
    const tag = createMockTag()
    const entries: TraversedEntry[] = [tag]

    const wrapper = mount(TraversedEntryComponent, {
      props: makeMockProps(entries),
    })

    const tagComponent = wrapper.findComponent({ name: 'Tag' })
    expect(tagComponent.props('tag')).toEqual(tag)
    expect(tagComponent.props('moreThanOneTag')).toBe(false)
  })
})
