import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the lazy-load module so we control what createLazyApiClientModal returns
vi.mock('./lazy-load', () => ({
  createLazyApiClientModal: vi.fn(),
}))

describe('get-or-create-api-client', () => {
  beforeEach(() => {
    vi.resetModules()
    // Ensure document.body is clean before each test
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates a host div and appends it to document.body', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    await getOrCreateApiClient()

    const host = document.body.querySelector('.scalar-app')
    expect(host).not.toBeNull()
    expect(host?.className).toBe('scalar-app')
  })

  it('passes the host element to createLazyApiClientModal', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    await getOrCreateApiClient()

    expect(createLazyApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        el: expect.any(HTMLDivElement),
      }),
    )
  })

  it('passes options to createLazyApiClientModal', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    await getOrCreateApiClient({ proxyUrl: 'https://proxy.example.com' })

    expect(createLazyApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { proxyUrl: 'https://proxy.example.com' },
      }),
    )
  })

  it('returns the apiClient and workspaceStore from createLazyApiClientModal', async () => {
    const mockApiClient = { open: vi.fn(), close: vi.fn() }
    const mockWorkspaceStore = { addDocument: vi.fn() }

    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    const result = await getOrCreateApiClient()

    expect(result?.apiClient).toBe(mockApiClient)
    expect(result?.workspaceStore).toBe(mockWorkspaceStore)
  })

  it('returns the same promise on repeated calls (singleton)', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    const promise1 = getOrCreateApiClient()
    const promise2 = getOrCreateApiClient()

    expect(promise1).toBe(promise2)
  })

  it('calls createLazyApiClientModal only once across multiple calls', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    await getOrCreateApiClient()
    await getOrCreateApiClient()
    await getOrCreateApiClient()

    expect(createLazyApiClientModal).toHaveBeenCalledTimes(1)
  })

  it('appends only one host element to document.body across multiple calls', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    await getOrCreateApiClient()
    await getOrCreateApiClient()
    await getOrCreateApiClient()

    const hosts = document.body.querySelectorAll('.scalar-app')
    expect(hosts.length).toBe(1)
  })

  it('resolves to the same result object on repeated awaits', async () => {
    const mockApiClient = { open: vi.fn(), close: vi.fn() }
    const mockWorkspaceStore = { addDocument: vi.fn() }

    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    const result1 = await getOrCreateApiClient()
    const result2 = await getOrCreateApiClient()

    expect(result1).toBe(result2)
  })

  it('uses empty object as default options when none are provided', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal).mockResolvedValue({
      apiClient: { open: vi.fn(), close: vi.fn() } as any,
      workspaceStore: { addDocument: vi.fn() } as any,
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    await getOrCreateApiClient()

    expect(createLazyApiClientModal).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {},
      }),
    )
  })

  it('clears the cached promise after a rejection so the next call retries', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({
        apiClient: { open: vi.fn(), close: vi.fn() } as any,
        workspaceStore: { addDocument: vi.fn() } as any,
      })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')

    await expect(getOrCreateApiClient()).rejects.toThrow('network error')

    // Second call must succeed (not return the cached rejected promise)
    const result = await getOrCreateApiClient()
    expect(result?.apiClient).toBeDefined()
    expect(createLazyApiClientModal).toHaveBeenCalledTimes(2)
  })

  it('removes the orphaned host element from document.body after a rejection', async () => {
    const { createLazyApiClientModal } = await import('./lazy-load')
    vi.mocked(createLazyApiClientModal)
      .mockRejectedValueOnce(new Error('chunk load failed'))
      .mockResolvedValueOnce({
        apiClient: { open: vi.fn(), close: vi.fn() } as any,
        workspaceStore: { addDocument: vi.fn() } as any,
      })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')

    await expect(getOrCreateApiClient()).rejects.toThrow('chunk load failed')

    // The orphaned host must have been removed
    expect(document.body.querySelectorAll('.scalar-app').length).toBe(0)

    // A successful retry appends exactly one new host
    await getOrCreateApiClient()
    expect(document.body.querySelectorAll('.scalar-app').length).toBe(1)
  })
})
