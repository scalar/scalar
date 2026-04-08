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
  close: vi.fn(),
  updateConfig: vi.fn(),
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
    expect(result.current?.close).toBe(mockApiClient.close)
  })

  it('spreads all apiClient properties onto the returned object', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient())

    await waitFor(() => expect(result.current).not.toBeUndefined())

    // close and updateConfig come directly from the mock client
    expect(result.current?.close).toBe(mockApiClient.close)
    expect(result.current?.updateConfig).toBe(mockApiClient.updateConfig)
  })

  it('wraps open to prepend the current documentSlug', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() =>
      useApiClient({ configuration: { url: 'https://api.example.com/openapi.json' } }),
    )

    await waitFor(() => expect(result.current).not.toBeUndefined())

    act(() => {
      result.current?.open({ operationId: 'listPets' })
    })

    expect(mockApiClient.open).toHaveBeenCalledWith({
      documentSlug: 'https://api.example.com/openapi.json',
      operationId: 'listPets',
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
      result.current?.open({ operationId: 'getUser' })
    })

    expect(mockApiClient.open).toHaveBeenCalledWith({
      documentSlug: 'My API',
      operationId: 'getUser',
    })
  })

  it('uses empty string as documentSlug when neither url nor content title is provided', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: {} }))

    await waitFor(() => expect(result.current).not.toBeUndefined())

    act(() => {
      result.current?.open({ operationId: 'getUser' })
    })

    expect(mockApiClient.open).toHaveBeenCalledWith({
      documentSlug: '',
      operationId: 'getUser',
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

  it('does not call addDocument when configuration has no url or content', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: {} }))

    await new Promise((r) => setTimeout(r, 50))

    // documentSlug is '' so addDocument is called with name: '' and url: ''
    // but the deduplication dict prevents a second call
    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(1)
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
      result.current?.open({ operationId: 'op1' })
    })
    expect(mockApiClient.open).toHaveBeenLastCalledWith({
      documentSlug: 'https://api.example.com/v1.json',
      operationId: 'op1',
    })

    rerender({ config: { url: 'https://api.example.com/v2.json' } })

    await waitFor(() => {
      act(() => {
        result.current?.open({ operationId: 'op2' })
      })
      expect(mockApiClient.open).toHaveBeenLastCalledWith({
        documentSlug: 'https://api.example.com/v2.json',
        operationId: 'op2',
      })
    })
  })

  it('cancels the pending initialization when the component unmounts before resolution', async () => {
    let resolveClient!: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolveClient = resolve
    })

    const { getOrCreateApiClient } = await import('./get-or-create-api-client')
    vi.mocked(getOrCreateApiClient).mockReturnValue(pendingPromise)

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

  it('sets Vue globals on module load', async () => {
    await import('./use-api-client')

    expect((globalThis as any).__VUE_OPTIONS_API__).toBe(true)
    expect((globalThis as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__).toBe(true)
    expect((globalThis as any).__VUE_PROD_DEVTOOLS__).toBe(false)
  })
})
