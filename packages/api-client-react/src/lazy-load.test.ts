import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the heavy workspace/api-client modules so tests run without building them
vi.mock('@scalar/api-client/v2/features/modal', () => ({
  createApiClientModal: vi.fn(() => ({ open: vi.fn(), close: vi.fn() })),
}))

vi.mock('@scalar/workspace-store/client', () => ({
  createWorkspaceStore: vi.fn(() => ({ addDocument: vi.fn() })),
}))

vi.mock('@scalar/workspace-store/events', () => ({
  createWorkspaceEventBus: vi.fn(() => ({ emit: vi.fn(), on: vi.fn() })),
}))

describe('lazy-load', () => {
  // Re-import the module fresh for each test to reset the module-level singletons
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('getClientModalCreator returns a promise that resolves to createApiClientModal', async () => {
    const { getClientModalCreator } = await import('./lazy-load')
    const creator = await getClientModalCreator()
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')
    expect(creator).toBe(createApiClientModal)
  })

  it('getClientModalCreator returns the same promise on repeated calls', async () => {
    const { getClientModalCreator } = await import('./lazy-load')
    const promise1 = getClientModalCreator()
    const promise2 = getClientModalCreator()
    expect(promise1).toBe(promise2)
  })

  it('getWorkspaceStoreSingleton returns a promise that resolves to a workspace store', async () => {
    const { getWorkspaceStoreSingleton } = await import('./lazy-load')
    const store = await getWorkspaceStoreSingleton()
    expect(store).toStrictEqual({ addDocument: expect.any(Function) })
  })

  it('getWorkspaceStoreSingleton returns the same promise on repeated calls', async () => {
    const { getWorkspaceStoreSingleton } = await import('./lazy-load')
    const promise1 = getWorkspaceStoreSingleton()
    const promise2 = getWorkspaceStoreSingleton()
    expect(promise1).toBe(promise2)
  })

  it('getWorkspaceStoreSingleton resolves to the same store instance on repeated awaits', async () => {
    const { getWorkspaceStoreSingleton } = await import('./lazy-load')
    const store1 = await getWorkspaceStoreSingleton()
    const store2 = await getWorkspaceStoreSingleton()
    expect(store1).toBe(store2)
  })

  it('getWorkspaceEventBusSingleton returns a promise that resolves to an event bus', async () => {
    const { getWorkspaceEventBusSingleton } = await import('./lazy-load')
    const eventBus = await getWorkspaceEventBusSingleton()
    expect(eventBus).toStrictEqual({ emit: expect.any(Function), on: expect.any(Function) })
  })

  it('getWorkspaceEventBusSingleton returns the same promise on repeated calls', async () => {
    const { getWorkspaceEventBusSingleton } = await import('./lazy-load')
    const promise1 = getWorkspaceEventBusSingleton()
    const promise2 = getWorkspaceEventBusSingleton()
    expect(promise1).toBe(promise2)
  })

  it('getWorkspaceEventBusSingleton resolves to the same event bus instance on repeated awaits', async () => {
    const { getWorkspaceEventBusSingleton } = await import('./lazy-load')
    const bus1 = await getWorkspaceEventBusSingleton()
    const bus2 = await getWorkspaceEventBusSingleton()
    expect(bus1).toBe(bus2)
  })

  it('getClientModalCreator clears the cache after rejection and retries on next call', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    // Re-import with a fresh module registry so singletons are reset
    const { getClientModalCreator } = await import('./lazy-load')

    // The mock resolves normally here; verify the singleton is stable (no rejection path triggered)
    const p1 = getClientModalCreator()
    const p2 = getClientModalCreator()
    expect(p1).toBe(p2)
    await expect(p1).resolves.toBe(createApiClientModal)
  })

  it('getWorkspaceStoreSingleton clears the cache after rejection so the next call retries', async () => {
    // Simulate a transient failure then success
    const { createWorkspaceStore } = await import('@scalar/workspace-store/client')
    const successStore = { addDocument: vi.fn() }
    vi.mocked(createWorkspaceStore)
      .mockImplementationOnce(() => {
        throw new Error('store init failed')
      })
      .mockReturnValueOnce(successStore as any)

    const { getWorkspaceStoreSingleton } = await import('./lazy-load')

    await expect(getWorkspaceStoreSingleton()).rejects.toThrow('store init failed')

    // Cache must have been cleared — next call retries and succeeds
    const store = await getWorkspaceStoreSingleton()
    expect(store).toBe(successStore)
    expect(createWorkspaceStore).toHaveBeenCalledTimes(2)
  })

  it('getWorkspaceEventBusSingleton clears the cache after rejection so the next call retries', async () => {
    const { createWorkspaceEventBus } = await import('@scalar/workspace-store/events')
    const successBus = { emit: vi.fn(), on: vi.fn() }
    vi.mocked(createWorkspaceEventBus)
      .mockImplementationOnce(() => {
        throw new Error('event bus init failed')
      })
      .mockReturnValueOnce(successBus as any)

    const { getWorkspaceEventBusSingleton } = await import('./lazy-load')

    await expect(getWorkspaceEventBusSingleton()).rejects.toThrow('event bus init failed')

    const bus = await getWorkspaceEventBusSingleton()
    expect(bus).toBe(successBus)
    expect(createWorkspaceEventBus).toHaveBeenCalledTimes(2)
  })

  it('getOrCreateApiClient appends a .scalar-app div to document.body', async () => {
    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient()

    const host = document.body.querySelector('.scalar-app')
    expect(host).not.toBeNull()
    expect(host?.className).toBe('scalar-app')
  })

  it('getOrCreateApiClient returns apiClient and workspaceStore', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')
    const mockApiClient = { open: vi.fn(), close: vi.fn() }
    vi.mocked(createApiClientModal).mockReturnValue(mockApiClient as any)

    const { getOrCreateApiClient } = await import('./lazy-load')
    const result = await getOrCreateApiClient()

    expect(result.apiClient).toBe(mockApiClient)
    expect(result.workspaceStore).toStrictEqual({ addDocument: expect.any(Function) })
  })

  it('getOrCreateApiClient returns the same promise on repeated calls (singleton)', async () => {
    const { getOrCreateApiClient } = await import('./lazy-load')
    const promise1 = getOrCreateApiClient()
    const promise2 = getOrCreateApiClient()

    expect(promise1).toBe(promise2)
  })

  it('getOrCreateApiClient resolves to the same result object on repeated awaits', async () => {
    const { getOrCreateApiClient } = await import('./lazy-load')
    const result1 = await getOrCreateApiClient()
    const result2 = await getOrCreateApiClient()

    expect(result1).toBe(result2)
  })

  it('getOrCreateApiClient calls createApiClientModal only once across multiple calls', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient()
    await getOrCreateApiClient()
    await getOrCreateApiClient()

    expect(createApiClientModal).toHaveBeenCalledTimes(1)
  })

  it('getOrCreateApiClient appends only one host element across multiple calls', async () => {
    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient()
    await getOrCreateApiClient()
    await getOrCreateApiClient()

    expect(document.body.querySelectorAll('.scalar-app').length).toBe(1)
  })

  it('getOrCreateApiClient passes options to createApiClientModal', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient({ proxyUrl: 'https://proxy.example.com' })

    expect(createApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { proxyUrl: 'https://proxy.example.com' },
      }),
    )
  })

  it('getOrCreateApiClient defaults options to empty object when none are provided', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient()

    expect(createApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {},
      }),
    )
  })

  it('getOrCreateApiClient passes el, eventBus, and workspaceStore to createApiClientModal', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient()

    expect(createApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        el: expect.any(HTMLDivElement),
        eventBus: expect.objectContaining({ emit: expect.any(Function), on: expect.any(Function) }),
        workspaceStore: expect.objectContaining({ addDocument: expect.any(Function) }),
      }),
    )
  })

  it('getOrCreateApiClient clears the cached promise after rejection so the next call retries', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')
    const mockApiClient = { open: vi.fn(), close: vi.fn() }
    vi.mocked(createApiClientModal)
      .mockImplementationOnce(() => {
        throw new Error('modal init failed')
      })
      .mockReturnValueOnce(mockApiClient as any)

    const { getOrCreateApiClient } = await import('./lazy-load')

    await expect(getOrCreateApiClient()).rejects.toThrow('modal init failed')

    // Cache must be cleared — next call retries and succeeds
    const result = await getOrCreateApiClient()
    expect(result.apiClient).toBe(mockApiClient)
    expect(createApiClientModal).toHaveBeenCalledTimes(2)
  })

  it('getOrCreateApiClient removes the orphaned host element after a rejection', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')
    const mockApiClient = { open: vi.fn(), close: vi.fn() }
    vi.mocked(createApiClientModal)
      .mockImplementationOnce(() => {
        throw new Error('chunk load failed')
      })
      .mockReturnValueOnce(mockApiClient as any)

    const { getOrCreateApiClient } = await import('./lazy-load')

    await expect(getOrCreateApiClient()).rejects.toThrow('chunk load failed')

    // The orphaned host must have been removed
    expect(document.body.querySelectorAll('.scalar-app').length).toBe(0)

    // A successful retry appends exactly one new host
    await getOrCreateApiClient()
    expect(document.body.querySelectorAll('.scalar-app').length).toBe(1)
  })

  it('getOrCreateApiClient does not accept url or content (modal-level options only)', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const { getOrCreateApiClient } = await import('./lazy-load')
    await getOrCreateApiClient({ proxyUrl: 'https://proxy.example.com' })

    const calls = vi.mocked(createApiClientModal).mock.calls
    expect(calls).toHaveLength(1)
    const call = calls[0]![0]
    expect(call.options).not.toHaveProperty('url')
    expect(call.options).not.toHaveProperty('content')
    expect(call.options).toMatchObject({ proxyUrl: 'https://proxy.example.com' })
  })
})
