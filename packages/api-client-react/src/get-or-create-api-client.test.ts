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
})
