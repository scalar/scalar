import { useWorkspace } from '@/store'
import {
  collectionSchema,
  operationSchema,
  requestExampleSchema,
  serverSchema,
  type SecurityScheme,
} from '@scalar/oas-utils/entities/spec'
import type { ClientId, TargetId } from '@scalar/snippetz'

import { mount } from '@vue/test-utils'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'

import RequestCodeExample from './RequestCodeExample.vue'

// Mock the useWorkspace hook
vi.mock('@/store', () => ({
  useWorkspace: vi.fn(),
}))

// Mock the snippetz library
vi.mock('@scalar/snippetz', () => ({
  snippetz: () => ({
    clients: () => [
      {
        key: 'js',
        title: 'JavaScript',
        clients: [
          { client: 'fetch', title: 'Fetch' },
          { client: 'axios', title: 'Axios' },
        ],
      },
      {
        key: 'shell',
        title: 'Shell',
        clients: [{ client: 'curl', title: 'Curl' }],
      },
    ],
  }),
}))

// Mock the operation
const mockOperation = operationSchema.parse({
  uid: 'mockOperationUid',
  method: 'get',
  security: [],
})

// Mock the collection
const mockCollection = collectionSchema.parse({
  uid: 'mockCollectionUid',
  security: [],
})

// Mock the example
const mockExample = requestExampleSchema.parse({
  uid: 'mockExampleUid',
})

// Mock the server
const mockServer = serverSchema.parse({
  uid: 'mockServerUid',
  url: 'https://api.example.com',
})

// Mock the workspace
const mockWorkspace = workspaceSchema.parse({
  uid: 'mockWorkspaceUid',
  selectedHttpClient: {
    targetKey: 'js' as TargetId,
    clientKey: 'fetch' as ClientId<'js'>,
  },
})

// Mock the workspace mutators
const mockWorkspaceMutators = {
  edit: vi.fn(),
}

describe('RequestCodeExample.vue', () => {
  beforeEach(() => {
    ;(useWorkspace as Mock).mockReturnValue({
      securitySchemes: {},
      workspaceMutators: mockWorkspaceMutators,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const props = {
    collection: mockCollection,
    example: mockExample,
    operation: mockOperation,
    server: mockServer,
    workspace: mockWorkspace,
  }

  it('renders correctly with default props', async () => {
    const wrapper = mount(RequestCodeExample, {
      props,
    })

    expect(wrapper.find('.w-full').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ViewLayoutCollapse' }).exists()).toBe(true)
    wrapper.unmount()
  })

  it('selects a different client when dropdown changes', async () => {
    const wrapper = mount(RequestCodeExample, {
      props,
    })

    await (wrapper.vm as any).selectClient({ id: 'shell,curl', label: 'curl' })

    expect(mockWorkspaceMutators.edit).toHaveBeenCalledWith('mockWorkspaceUid', 'selectedHttpClient', {
      targetKey: 'shell' as TargetId,
      clientKey: 'curl' as ClientId<'shell'>,
    })

    wrapper.unmount()
  })

  it('filters security schemes correctly', async () => {
    const securitySchemes = {
      'auth': {
        uid: 'auth',
        type: 'apiKey',
        value: 'test-key',
        nameKey: 'X-API-Key',
        in: 'header',
      },
    }

    mockOperation.security = [{ 'auth': [] }]
    mockOperation.selectedSecuritySchemeUids = ['auth'] as SecurityScheme['uid'][]
    ;(useWorkspace as Mock).mockReturnValue({
      securitySchemes,
      workspaceMutators: mockWorkspaceMutators,
    })

    const wrapper = mount(RequestCodeExample, {
      props,
    })

    expect((wrapper.vm as any).selectedSecuritySchemes.length).toBe(1)
    expect((wrapper.vm as any).selectedSecuritySchemes[0]).toEqual(securitySchemes['auth'])

    wrapper.unmount()
  })
})
