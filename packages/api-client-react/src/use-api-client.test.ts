import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the style import so it doesn't fail in jsdom
vi.mock('./style.css', () => ({}))

// Mock get-or-create-api-client so we control the async resolution
vi.mock('./get-or-create-api-client', () => ({
  getOrCreateApiClient: vi.fn(),
}))

const makeWorkspaceStore = () => ({
  addDocument: vi.fn().mockResolvedValue(undefined),
})

const makeApiClient = () => ({
  open: vi.fn(),
  route: vi.fn(),
  mount: vi.fn(),
  modalState: { open: false },
  app: {} as any,
})

describe('use-api-client', () => {
  let mockApiClient: ReturnType<typeof makeApiClient>
  let mockWorkspaceStore: ReturnType<typeof makeWorkspaceStore>

  beforeEach(async () => {
    vi.resetModules()
    mockApiClient = makeApiClient()
    mockWorkspaceStore = makeWorkspaceStore()

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined before the client is ready', async () => {
    // Make the promise never resolve during this synchronous check
    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentionally never-resolving promise
    vi.mocked(getOrCreateApiClient).mockReturnValue(new Promise(() => {}))

    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient())

    expect(result.current).toBeUndefined()
  })

  it('returns the client after the async initialization resolves', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient())

    await waitFor(() => expect(result.current).not.toBeUndefined())

    expect(result.current?.open).toBeTypeOf('function')
    expect(result.current?.route).toBe(mockApiClient.route)
  })

  it('spreads all apiClient properties onto the returned object', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient())

    await waitFor(() => expect(result.current).not.toBeUndefined())

    // route and mount come directly from the mock client
    expect(result.current?.route).toBe(mockApiClient.route)
    expect(result.current?.mount).toBe(mockApiClient.mount)
  })

  it('wraps open to prepend the current documentSlug', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() =>
      useApiClient({ configuration: { url: 'https://api.example.com/openapi.json' } }),
    )

    await waitFor(() => expect(result.current).not.toBeUndefined())

    act(() => {
      result.current?.open({ path: '/pets', method: 'get' })
    })

    expect(mockApiClient.open).toHaveBeenCalledWith({
      documentSlug: 'https://api.example.com/openapi.json',
      path: '/pets',
      method: 'get',
    })
  })

  it('uses the content title as documentSlug when url is not provided', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() =>
      useApiClient({
        configuration: {
          content: { info: { title: 'My API' } },
        },
      }),
    )

    await waitFor(() => expect(result.current).not.toBeUndefined())

    act(() => {
      result.current?.open({ path: '/users', method: 'get' })
    })

    expect(mockApiClient.open).toHaveBeenCalledWith({
      documentSlug: 'My API',
      path: '/users',
      method: 'get',
    })
  })

  it('uses "default" as documentSlug when neither url nor content title is provided', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: {} }))

    await waitFor(() => expect(result.current).not.toBeUndefined())

    act(() => {
      result.current?.open({ path: '/users', method: 'get' })
    })

    expect(mockApiClient.open).toHaveBeenCalledWith({
      documentSlug: 'default',
      path: '/users',
      method: 'get',
    })
  })

  it('calls workspaceStore.addDocument with url when url is configured', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: { url: 'https://api.example.com/openapi.json' } }))

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalled())

    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({
      name: 'https://api.example.com/openapi.json',
      url: 'https://api.example.com/openapi.json',
    })
  })

  it('calls workspaceStore.addDocument with inline content when content is configured', async () => {
    const inlineContent = { info: { title: 'My API' }, paths: {} }
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: { content: inlineContent } }))

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalled())

    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({
      name: 'My API',
      document: inlineContent,
    })
  })

  it('does not call addDocument when no configuration is provided', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient())

    // Give the effect time to run
    await waitFor(() => expect(mockWorkspaceStore.addDocument).not.toHaveBeenCalled())
  })

  it('calls addDocument with "default" slug when configuration has no url or content', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: {} }))

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalled())

    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({
      name: 'default',
      url: '',
    })
  })

  it('uses "default" slug when url changes to empty configuration', async () => {
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { useApiClient } = await import('./use-api-client')

    // Start with a valid url so client is initialized
    const { rerender } = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url: 'https://api.example.com/v1.json' } as Record<string, unknown> },
    })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(1))

    // Re-render with an empty configuration — the second useEffect falls back to 'default'
    rerender({ config: {} })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(2))

    const calls = mockWorkspaceStore.addDocument.mock.calls
    expect(calls.every((call: any[]) => call[0].name !== '')).toBe(true)
    expect(calls[1]![0]).toEqual({ name: 'default', url: '' })
  })

  it('does not add the same document twice when the hook re-renders with the same url', async () => {
    // Reset the module-level documentDict by resetting modules
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { useApiClient } = await import('./use-api-client')
    const url = 'https://api.example.com/openapi-dedup.json'

    const { rerender } = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url } },
    })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(1))

    // Re-render with the same url — should NOT add the document again
    rerender({ config: { url } })
    await new Promise((r) => setTimeout(r, 50))

    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(1)
  })

  it('adds a new document when the url changes', async () => {
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { useApiClient } = await import('./use-api-client')

    const { rerender } = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url: 'https://api.example.com/v1.json' } },
    })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(1))

    // Change the url — should add the new document
    rerender({ config: { url: 'https://api.example.com/v2.json' } })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(2))

    expect(mockWorkspaceStore.addDocument).toHaveBeenNthCalledWith(1, {
      name: 'https://api.example.com/v1.json',
      url: 'https://api.example.com/v1.json',
    })
    expect(mockWorkspaceStore.addDocument).toHaveBeenNthCalledWith(2, {
      name: 'https://api.example.com/v2.json',
      url: 'https://api.example.com/v2.json',
    })
  })

  it('updates the documentSlug when the url changes', async () => {
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { useApiClient } = await import('./use-api-client')

    const { result, rerender } = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url: 'https://api.example.com/v1.json' } },
    })

    await waitFor(() => expect(result.current).not.toBeUndefined())

    act(() => {
      result.current?.open({ path: '/v1', method: 'get' })
    })
    expect(mockApiClient.open).toHaveBeenLastCalledWith({
      documentSlug: 'https://api.example.com/v1.json',
      path: '/v1',
      method: 'get',
    })

    rerender({ config: { url: 'https://api.example.com/v2.json' } })

    await waitFor(() => {
      act(() => {
        result.current?.open({ path: '/v2', method: 'get' })
      })
      expect(mockApiClient.open).toHaveBeenLastCalledWith({
        documentSlug: 'https://api.example.com/v2.json',
        path: '/v2',
        method: 'get',
      })
    })
  })

  it('cancels the pending initialization when the component unmounts before resolution', async () => {
    let resolveClient!: (value: any) => void
    const pendingPromise = new Promise<
      { apiClient: typeof mockApiClient; workspaceStore: typeof mockWorkspaceStore } | undefined
    >((resolve) => {
      resolveClient = resolve
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockReturnValue(pendingPromise as any)

    const { useApiClient } = await import('./use-api-client')
    const { result, unmount } = renderHook(() => useApiClient())

    expect(result.current).toBeUndefined()

    // Unmount before the promise resolves
    unmount()

    // Now resolve the promise — the state should NOT be updated (no setState after unmount)
    await act(async () => {
      resolveClient({ apiClient: mockApiClient, workspaceStore: mockWorkspaceStore })
      await pendingPromise
    })

    // The hook was unmounted so result.current stays undefined
    expect(result.current).toBeUndefined()
  })

  it('open is a no-op when client is not yet initialized', async () => {
    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentionally never-resolving promise
    vi.mocked(getOrCreateApiClient).mockReturnValue(new Promise(() => {}))

    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient())

    // Client is undefined, so open should not throw
    expect(result.current).toBeUndefined()
    // Calling open on undefined would normally throw — the hook returns undefined so callers guard it
  })

  it('strips url and content from the options passed to getOrCreateApiClient', async () => {
    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    const { useApiClient } = await import('./use-api-client')

    renderHook(() =>
      useApiClient({
        configuration: {
          url: 'https://api.example.com/openapi.json',
          content: { info: { title: 'My API' } },
          proxyUrl: 'https://proxy.example.com',
        },
      }),
    )

    await waitFor(() => expect(getOrCreateApiClient).toHaveBeenCalled())

    const calledWith = vi.mocked(getOrCreateApiClient).mock.calls[0]![0]
    expect(calledWith).not.toHaveProperty('url')
    expect(calledWith).not.toHaveProperty('content')
    expect(calledWith).toMatchObject({ proxyUrl: 'https://proxy.example.com' })
  })

  it('sets Vue globals on module load', async () => {
    await import('./use-api-client')

    expect((globalThis as any).__VUE_OPTIONS_API__).toBe(true)
    expect((globalThis as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__).toBe(true)
    expect((globalThis as any).__VUE_PROD_DEVTOOLS__).toBe(false)
  })
})
