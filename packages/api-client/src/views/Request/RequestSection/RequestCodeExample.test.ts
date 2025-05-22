import { useWorkspace } from '@/store'
import {
  collectionSchema,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import type { ClientId, TargetId } from '@scalar/snippetz'

import { mount } from '@vue/test-utils'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import { useActiveEntities } from '@/store/active-entities'

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

vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(),
}))
const mockUseActiveEntities = useActiveEntities as Mock
const mockActiveEntities = {
  setActiveRequest: vi.fn(),
  setActiveExample: vi.fn(),
}

describe('RequestCodeExample.vue', () => {
  beforeEach(() => {
    ;(useWorkspace as Mock).mockReturnValue({
      securitySchemes: {},
      workspaceMutators: mockWorkspaceMutators,
    })
    mockUseActiveEntities.mockReturnValue(mockActiveEntities)
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
    selectedClient: { targetKey: 'js' as TargetId, clientKey: 'fetch' as ClientId<'js'> },
    environment: [],
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
    const scheme = securitySchemeSchema.parse({
      uid: 'authUid',
      type: 'apiKey',
      nameKey: 'auth',
      value: 'test-key',
      in: 'header',
    })
    const securitySchemes = {
      [scheme.uid]: scheme,
    }

    mockOperation.security = [{ [scheme.nameKey]: [] }]
    mockOperation.selectedSecuritySchemeUids = [scheme.uid]
    ;(useWorkspace as Mock).mockReturnValue({
      securitySchemes,
      workspaceMutators: mockWorkspaceMutators,
    })

    const wrapper = mount(RequestCodeExample, {
      props,
    })

    expect((wrapper.vm as any).selectedSecuritySchemes.length).toBe(1)
    expect((wrapper.vm as any).selectedSecuritySchemes[0]).toEqual(securitySchemes[scheme.uid])

    wrapper.unmount()
  })

  it('includes optional selected security schemes', async () => {
    const requiredScheme = securitySchemeSchema.parse({
      uid: 'requiredUid',
      type: 'apiKey',
      nameKey: 'required',
      value: 'required-key',
      in: 'header',
    })
    const optionalScheme = securitySchemeSchema.parse({
      uid: 'optionalUid',
      type: 'apiKey',
      nameKey: 'optional',
      value: 'optional-key',
      in: 'header',
    })
    const securitySchemes = {
      [requiredScheme.uid]: requiredScheme,
      [optionalScheme.uid]: optionalScheme,
    }

    // Only 'required' is required by operation.security
    mockOperation.security = [{ [requiredScheme.nameKey]: [] }]
    // Both are selected
    mockOperation.selectedSecuritySchemeUids = [requiredScheme.uid, optionalScheme.uid]
    ;(useWorkspace as Mock).mockReturnValue({
      securitySchemes,
      workspaceMutators: mockWorkspaceMutators,
    })

    const wrapper = mount(RequestCodeExample, {
      props,
    })

    // Should include both required and optional because both are selected
    const selected = (wrapper.vm as any).selectedSecuritySchemes
    expect(selected.length).toBe(2)
    expect(selected).toContain(securitySchemes[requiredScheme.uid])
    expect(selected).toContain(securitySchemes[optionalScheme.uid])

    wrapper.unmount()
  })
})
