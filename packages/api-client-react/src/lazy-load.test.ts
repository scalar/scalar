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

  it('createLazyApiClientModal mounts the modal and returns apiClient and workspaceStore', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    const el = document.createElement('div')
    const result = await createLazyApiClientModal({ el })

    expect(result.apiClient).toStrictEqual({ open: expect.any(Function), close: expect.any(Function) })
    expect(result.workspaceStore).toStrictEqual({ addDocument: expect.any(Function) })
  })

  it('createLazyApiClientModal passes el and eventBus and workspaceStore to createApiClientModal', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const el = document.createElement('div')
    await createLazyApiClientModal({ el, options: { proxyUrl: 'https://proxy.example.com' } })

    expect(createApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        el,
        options: { proxyUrl: 'https://proxy.example.com' },
      }),
    )
  })

  it('createLazyApiClientModal defaults options to empty object when not provided', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')

    const el = document.createElement('div')
    await createLazyApiClientModal({ el })

    expect(createApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        el,
        options: {},
      }),
    )
  })

  it('createLazyApiClientModal reuses the singleton workspace store across calls', async () => {
    const { createLazyApiClientModal, getWorkspaceStoreSingleton } = await import('./lazy-load')

    const el1 = document.createElement('div')
    const el2 = document.createElement('div')

    const result1 = await createLazyApiClientModal({ el: el1 })
    const result2 = await createLazyApiClientModal({ el: el2 })

    // Both should reference the same singleton store
    expect(result1.workspaceStore).toBe(result2.workspaceStore)

    // And it should be the same as the direct singleton getter
    const singletonStore = await getWorkspaceStoreSingleton()
    expect(result1.workspaceStore).toBe(singletonStore)
  })

  it('createLazyApiClientModal calls createWorkspaceStore only once across multiple calls', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    const { createWorkspaceStore } = await import('@scalar/workspace-store/client')

    const el1 = document.createElement('div')
    const el2 = document.createElement('div')

    await createLazyApiClientModal({ el: el1 })
    await createLazyApiClientModal({ el: el2 })

    expect(createWorkspaceStore).toHaveBeenCalledTimes(1)
  })

  it('createLazyApiClientModal calls createWorkspaceEventBus only once across multiple calls', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    const { createWorkspaceEventBus } = await import('@scalar/workspace-store/events')

    const el1 = document.createElement('div')
    const el2 = document.createElement('div')

    await createLazyApiClientModal({ el: el1 })
    await createLazyApiClientModal({ el: el2 })

    expect(createWorkspaceEventBus).toHaveBeenCalledTimes(1)
  })

  it('each call to createLazyApiClientModal creates a new modal instance', async () => {
    const { createApiClientModal } = await import('@scalar/api-client/v2/features/modal')
    const mockModal1 = { open: vi.fn(), close: vi.fn() }
    const mockModal2 = { open: vi.fn(), close: vi.fn() }
    vi.mocked(createApiClientModal)
      .mockReturnValueOnce(mockModal1 as any)
      .mockReturnValueOnce(mockModal2 as any)

    const { createLazyApiClientModal } = await import('./lazy-load')

    const el1 = document.createElement('div')
    const el2 = document.createElement('div')

    const result1 = await createLazyApiClientModal({ el: el1 })
    const result2 = await createLazyApiClientModal({ el: el2 })

    expect(result1.apiClient).toBe(mockModal1)
    expect(result2.apiClient).toBe(mockModal2)
    expect(result1.apiClient).not.toBe(result2.apiClient)
  })
})
