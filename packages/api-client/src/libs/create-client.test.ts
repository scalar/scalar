import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApiClient, type CreateApiClientParams, type OpenClientPayload } from './create-client'
import { createWorkspaceStore, type CreateWorkspaceStoreOptions } from '@/store/store'
import { createActiveEntitiesStore } from '@/store/active-entities'
import { createSidebarState } from '@/hooks/useSidebar'
import { loadAllResources } from '@/libs/local-storage'
import {
  requestExampleSchema,
  requestSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'

// Mock dependencies
vi.mock('@/store/store', () => ({
  createWorkspaceStore: vi.fn(() => ({
    workspaceMutators: {
      add: vi.fn(),
      rawAdd: vi.fn(),
      edit: vi.fn(),
    },
    collectionMutators: {
      edit: vi.fn(),
      reset: vi.fn(),
    },
    requestMutators: { reset: vi.fn() },
    requestExampleMutators: {
      reset: vi.fn(),
      edit: vi.fn(),
    },
    securitySchemeMutators: {
      reset: vi.fn(),
      edit: vi.fn(),
    },
    serverMutators: { reset: vi.fn() },
    tagMutators: { reset: vi.fn() },
    importSpecFile: vi.fn(),
    importSpecFromUrl: vi.fn(),
    modalState: { open: false },
    requests: {},
    securitySchemes: {},
    servers: {},
  })),
  WORKSPACE_SYMBOL: Symbol('workspace'),
}))

vi.mock('@/store/active-entities', () => ({
  createActiveEntitiesStore: vi.fn(() => ({
    activeCollection: { value: { uid: 'collection-1' } },
    activeWorkspace: { value: { uid: 'workspace-1' } },
  })),
  ACTIVE_ENTITIES_SYMBOL: Symbol('active-entities'),
}))

vi.mock('@/hooks/useSidebar', () => ({
  createSidebarState: vi.fn(() => ({})),
  SIDEBAR_SYMBOL: Symbol('sidebar'),
}))

vi.mock('@/hooks/useLayout', () => ({
  LAYOUT_SYMBOL: Symbol('layout'),
}))

vi.mock('@/libs/local-storage', () => ({
  loadAllResources: vi.fn(),
}))

vi.mock('vue', () => ({
  createApp: vi.fn(() => ({
    use: vi.fn(),
    provide: vi.fn(),
    mount: vi.fn(),
    config: {
      idPrefix: '',
    },
  })),
  ref: vi.fn((value) => ({ value })),
  watch: vi.fn((getter, callback) => {
    // Store the callback for testing
    watchCallbacks.push({ getter, callback })
  }),
}))

// Store watch callbacks for testing
const watchCallbacks: Array<{ getter: Function; callback: Function }> = []

describe('createApiClient', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockElement = document.createElement('div')

  const defaultWorkspaceOptions = {
    useLocalStorage: true,
    showSidebar: true,
    proxyUrl: 'https://proxy.scalar.com',
    theme: 'alternate',
    hideClientButton: false,
    _integration: 'vue',
  } satisfies CreateWorkspaceStoreOptions

  const defaultParams: CreateApiClientParams = {
    el: mockElement,
    appComponent: {},
    router: mockRouter as any,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    watchCallbacks.length = 0

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'table').mockImplementation(() => {})

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create an API client with default parameters', () => {
    const client = createApiClient(defaultParams)

    expect(createWorkspaceStore).toHaveBeenCalled()
    expect(createActiveEntitiesStore).toHaveBeenCalled()
    expect(createSidebarState).toHaveBeenCalled()

    expect(client).toHaveProperty('app')
    expect(client).toHaveProperty('updateConfig')
    expect(client).toHaveProperty('updateServer')
    expect(client).toHaveProperty('onUpdateServer')
    expect(client).toHaveProperty('updateAuth')
    expect(client).toHaveProperty('route')
    expect(client).toHaveProperty('open')
    expect(client).toHaveProperty('mount')
    expect(client).toHaveProperty('modalState')
    expect(client).toHaveProperty('store')
    expect(client).toHaveProperty('updateExample')
  })

  it('should use provided store if available', () => {
    const mockStore = createWorkspaceStore(defaultWorkspaceOptions)

    createApiClient({
      ...defaultParams,
      store: mockStore,
    })

    // Should not create a new store
    expect(createWorkspaceStore).toHaveBeenCalledTimes(1)
  })

  it('should not mount if mountOnInitialize is false', () => {
    const client = createApiClient({
      ...defaultParams,
      mountOnInitialize: false,
    })

    // Vue app's mount should not be called
    expect(client.app.mount).not.toHaveBeenCalled()

    // But mount method should be available
    client.mount(mockElement)
    expect(client.app.mount).toHaveBeenCalledWith(mockElement)
  })

  it('should handle localStorage loading when available', () => {
    // Mock localStorage to have workspace data
    window.localStorage.getItem = vi.fn().mockReturnValue('{}')
    createApiClient(defaultParams)
    expect(loadAllResources).toHaveBeenCalled()
  })

  it('should update config and reset store when spec is provided', () => {
    const client = createApiClient(defaultParams)
    const mockStore = client.store

    client.updateConfig({
      url: 'https://example.com/openapi.json',
    })

    // Should reset all stores
    expect(mockStore.collectionMutators.reset).toHaveBeenCalled()
    expect(mockStore.requestMutators.reset).toHaveBeenCalled()
    expect(mockStore.requestExampleMutators.reset).toHaveBeenCalled()
    expect(mockStore.securitySchemeMutators.reset).toHaveBeenCalled()
    expect(mockStore.serverMutators.reset).toHaveBeenCalled()
    expect(mockStore.tagMutators.reset).toHaveBeenCalled()

    // Should update workspace collections
    expect(mockStore.workspaceMutators.edit).toHaveBeenCalledWith('workspace-1', 'collections', [])

    // Should import spec from URL
    expect(mockStore.importSpecFromUrl).toHaveBeenCalledWith(
      'https://example.com/openapi.json',
      'workspace-1',
      expect.any(Object),
    )
  })

  // Setup a client with a store
  const scheme = securitySchemeSchema.parse({ uid: 'scheme-1', nameKey: 'api_key', type: 'apiKey' })
  const server = serverSchema.parse({ uid: 'server-1', url: 'https://api.example.com' })
  const request = requestSchema.parse({
    uid: 'request-1',
    path: '/users',
    method: 'get',
    operationId: 'getUsers',
    requestBody: {
      content: {
        'application/json': {
          examples: {
            'example-1': {
              value: { name: 'John' },
            },
          },
        },
      },
    },
    examples: ['example-uid-1'],
  })
  const requestExample = requestExampleSchema.parse({
    uid: 'example-uid-1',
    value: { name: 'John' },
  })

  const client = createApiClient({
    ...defaultParams,
    store: {
      ...createWorkspaceStore({
        useLocalStorage: false,
        showSidebar: false,
        hideClientButton: true,
        theme: 'default',
        proxyUrl: 'https://proxy.scalar.com',
        _integration: 'vue',
      }),
      requests: {
        [request.uid]: request,
      },
      requestExamples: {
        [requestExample.uid]: requestExample,
      },
      securitySchemes: {
        [scheme.uid]: scheme,
      },
      servers: {
        [server.uid]: server,
      },
    },
  })

  it('should update server correctly', () => {
    client.updateServer('https://api.example.com')
    expect(client.store.collectionMutators.edit).toHaveBeenCalledWith('collection-1', 'selectedServerUid', 'server-1')
  })

  it('should handle onUpdateServer callback', () => {
    const callback = vi.fn()
    client.onUpdateServer(callback)

    // Find the watch callback and trigger it
    const watchCallback = watchCallbacks.find((w) => w.getter.toString().includes('activeCollection'))
    if (watchCallback) {
      watchCallback.callback('server-1')
      expect(callback).toHaveBeenCalledWith('https://api.example.com')
    }
  })

  it('should update auth values correctly', () => {
    client.updateAuth({
      nameKey: 'api_key',
      propertyKey: 'value',
      value: 'my-api-key',
    })

    expect(client.store.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-1', 'value', 'my-api-key')
  })

  it('should route to a request correctly', () => {
    const payload: OpenClientPayload = {
      path: '/users',
      method: 'get',
    }
    client.route(payload)

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'request',
      query: {},
      params: {
        workspace: 'default',
        request: 'request-1',
      },
    })
  })

  it('should handle source in route payload', () => {
    const payload: OpenClientPayload = {
      path: '/users',
      method: 'get',
      _source: 'api-reference',
    }

    client.route(payload)

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'request',
      query: { source: 'api-reference' },
      params: {
        workspace: 'default',
        request: 'request-1',
      },
    })
  })

  it('should open the modal and route to a request', () => {
    const payload: OpenClientPayload = {
      path: '/users',
      method: 'get',
    }
    client.open(payload)

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'request',
      query: {},
      params: {
        workspace: 'default',
        request: 'request-1',
      },
    })
    expect(client.modalState.open).toBe(true)
  })

  it('should update example correctly', () => {
    client.updateExample('example-1', 'getUsers')

    expect(client.store.requestExampleMutators.edit).toHaveBeenCalledWith(
      'example-uid-1',
      'body.raw.value',
      expect.any(String),
    )
  })
})
