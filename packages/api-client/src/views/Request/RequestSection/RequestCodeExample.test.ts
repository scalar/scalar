import {
  collectionSchema,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import type { ClientId, TargetId } from '@scalar/snippetz'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkspace } from '@/store'

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
} as Partial<ReturnType<typeof useWorkspace>['requestExampleMutators']>

describe('RequestCodeExample.vue', () => {
  beforeEach(() => {
    vi.mocked(useWorkspace).mockReturnValue({
      securitySchemes: {},
      workspaceMutators: mockWorkspaceMutators,
    } as unknown as ReturnType<typeof useWorkspace>)

    return () => {
      vi.clearAllMocks()
    }
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

  it('renders correctly with default props', () => {
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

  it('filters security schemes correctly', () => {
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
    vi.mocked(useWorkspace).mockReturnValue({
      securitySchemes,
      workspaceMutators: mockWorkspaceMutators,
    } as unknown as ReturnType<typeof useWorkspace>)

    const wrapper = mount(RequestCodeExample, {
      props,
    })

    expect((wrapper.vm as any).selectedSecuritySchemes.length).toBe(1)
    expect((wrapper.vm as any).selectedSecuritySchemes[0]).toEqual(securitySchemes[scheme.uid])

    wrapper.unmount()
  })

  it('includes optional selected security schemes', () => {
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
    vi.mocked(useWorkspace).mockReturnValue({
      securitySchemes,
      workspaceMutators: mockWorkspaceMutators,
    } as unknown as ReturnType<typeof useWorkspace>)

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
