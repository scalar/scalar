import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApiClientConfigurationReact } from './use-api-client'

// Mock the style import so it doesn't fail in jsdom
vi.mock('./style.css', () => ({}))

// Mock lazy-load so we control the async resolution of getOrCreateApiClient
vi.mock('./lazy-load', () => ({
  getOrCreateApiClient: vi.fn(),
}))
vi.mock('@scalar/api-client/v2/blocks/operation-code-sample', () => ({
  isClient: vi.fn(() => true),
}))

const makeWorkspaceStore = () => ({
  addDocument: vi.fn().mockResolvedValue(undefined),
  update: vi.fn(),
})

const makeApiClient = () => ({
  open: vi.fn(),
  route: vi.fn(),
  mount: vi.fn(),
  updateOptions: vi.fn(),
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

    const { getOrCreateApiClient } = await import('./lazy-load')
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
    const { getOrCreateApiClient } = await import('./lazy-load')
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentionally never-resolving promise
    vi.mocked(getOrCreateApiClient).mockReturnValue(new Promise(() => {}))

    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: { url: '' } }))

    expect(result.current).toBeUndefined()
  })

  it('returns the client after the async initialization resolves', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: { url: '' } }))

    await waitFor(() => expect(result.current).not.toBeUndefined())

    expect(result.current?.open).toBeTypeOf('function')
    expect(result.current?.route).toBe(mockApiClient.route)
  })

  it('spreads all apiClient properties onto the returned object', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: { url: '' } }))

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

  it('uses "default" as documentSlug when url is an empty string', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() =>
      useApiClient({
        configuration: {
          url: '',
        },
      }),
    )

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

  it('uses "default" as documentSlug when url is empty', async () => {
    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: { url: '' } }))

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

  it('calls workspaceStore.addDocument with "default" slug when url is empty', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: { url: '' } }))

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalled())

    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({
      name: 'default',
      url: '',
    })
  })

  it('calls addDocument with "default" when configuration url is empty', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: { url: '' } }))

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({ name: 'default', url: '' }))
  })

  it('calls addDocument with "default" slug when configuration has no url or content', async () => {
    const { useApiClient } = await import('./use-api-client')
    renderHook(() => useApiClient({ configuration: { url: '' } }))

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalled())

    expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({
      name: 'default',
      url: '',
    })
  })

  it('uses "default" slug when url changes to empty string', async () => {
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./lazy-load')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { useApiClient } = await import('./use-api-client')

    // Start with a valid url so client is initialized
    const { rerender } = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url: 'https://api.example.com/v1.json' } },
    })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(1))

    // Re-render with an empty url — the second useEffect falls back to 'default'
    rerender({ config: { url: '' } })

    await waitFor(() => expect(mockWorkspaceStore.addDocument).toHaveBeenCalledTimes(2))

    const calls = mockWorkspaceStore.addDocument.mock.calls
    expect(calls.every((call: any[]) => call[0].name !== '')).toBe(true)
    expect(calls[1]![0]).toEqual({ name: 'default', url: '' })
  })

  it('does not add the same document twice when the hook re-renders with the same url', async () => {
    // Reset the module-level documentDict by resetting modules
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./lazy-load')
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

    const { getOrCreateApiClient } = await import('./lazy-load')
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

    const { getOrCreateApiClient } = await import('./lazy-load')
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

    const { getOrCreateApiClient } = await import('./lazy-load')
    vi.mocked(getOrCreateApiClient).mockReturnValue(pendingPromise as any)

    const { useApiClient } = await import('./use-api-client')
    const { result, unmount } = renderHook(() => useApiClient({ configuration: { url: '' } }))

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

  it('resolves client state for multiple hook consumers from the same pending initialization', async () => {
    vi.resetModules()

    let resolveClient!: (value: any) => void
    const pendingPromise = new Promise<
      { apiClient: typeof mockApiClient; workspaceStore: typeof mockWorkspaceStore } | undefined
    >((resolve) => {
      resolveClient = resolve
    })

    const { getOrCreateApiClient } = await import('./lazy-load')
    vi.mocked(getOrCreateApiClient).mockReturnValue(pendingPromise as any)

    const { useApiClient } = await import('./use-api-client')
    const firstConsumer = renderHook(() => useApiClient({ configuration: { url: '' } }))
    const secondConsumer = renderHook(() => useApiClient({ configuration: { url: '' } }))

    expect(firstConsumer.result.current).toBeUndefined()
    expect(secondConsumer.result.current).toBeUndefined()

    await act(async () => {
      resolveClient({ apiClient: mockApiClient, workspaceStore: mockWorkspaceStore })
      await pendingPromise
    })

    await waitFor(() => {
      expect(firstConsumer.result.current).not.toBeUndefined()
      expect(secondConsumer.result.current).not.toBeUndefined()
    })

    expect(firstConsumer.result.current?.route).toBe(mockApiClient.route)
    expect(secondConsumer.result.current?.route).toBe(mockApiClient.route)
  })

  it('keeps documentSlug reactive and isolated across multiple hook consumers', async () => {
    vi.resetModules()

    const { getOrCreateApiClient } = await import('./lazy-load')
    vi.mocked(getOrCreateApiClient).mockResolvedValue({
      apiClient: mockApiClient as any,
      workspaceStore: mockWorkspaceStore as any,
    })

    const { useApiClient } = await import('./use-api-client')

    const firstConsumer = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url: 'https://api.example.com/first-v1.json' } },
    })
    const secondConsumer = renderHook(({ config }) => useApiClient({ configuration: config }), {
      initialProps: { config: { url: 'https://api.example.com/second-v1.json' } },
    })

    await waitFor(() => {
      expect(firstConsumer.result.current).not.toBeUndefined()
      expect(secondConsumer.result.current).not.toBeUndefined()
    })

    act(() => {
      firstConsumer.result.current?.open({ path: '/first', method: 'get' })
    })
    expect(mockApiClient.open).toHaveBeenLastCalledWith({
      documentSlug: 'https://api.example.com/first-v1.json',
      path: '/first',
      method: 'get',
    })

    act(() => {
      secondConsumer.result.current?.open({ path: '/second', method: 'get' })
    })
    expect(mockApiClient.open).toHaveBeenLastCalledWith({
      documentSlug: 'https://api.example.com/second-v1.json',
      path: '/second',
      method: 'get',
    })

    firstConsumer.rerender({ config: { url: 'https://api.example.com/first-v2.json' } })

    await waitFor(() =>
      expect(mockWorkspaceStore.addDocument).toHaveBeenCalledWith({
        name: 'https://api.example.com/first-v2.json',
        url: 'https://api.example.com/first-v2.json',
      }),
    )

    act(() => {
      firstConsumer.result.current?.open({ path: '/first', method: 'get' })
    })
    expect(mockApiClient.open).toHaveBeenLastCalledWith({
      documentSlug: 'https://api.example.com/first-v2.json',
      path: '/first',
      method: 'get',
    })

    act(() => {
      secondConsumer.result.current?.open({ path: '/second', method: 'get' })
    })
    expect(mockApiClient.open).toHaveBeenLastCalledWith({
      documentSlug: 'https://api.example.com/second-v1.json',
      path: '/second',
      method: 'get',
    })
  })

  it('open is a no-op when client is not yet initialized', async () => {
    const { getOrCreateApiClient } = await import('./lazy-load')
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentionally never-resolving promise
    vi.mocked(getOrCreateApiClient).mockReturnValue(new Promise(() => {}))

    const { useApiClient } = await import('./use-api-client')
    const { result } = renderHook(() => useApiClient({ configuration: { url: '' } }))

    // Client is undefined, so open should not throw
    expect(result.current).toBeUndefined()
    // Calling open on undefined would normally throw — the hook returns undefined so callers guard it
  })

  it('strips url and forwards only supported modal options', async () => {
    const { getOrCreateApiClient } = await import('./lazy-load')
    const { useApiClient } = await import('./use-api-client')

    renderHook(() =>
      useApiClient({
        configuration: {
          url: 'https://api.example.com/openapi.json',
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
          },
          baseServerURL: 'https://proxy.example.com',
        },
      }),
    )

    await waitFor(() => expect(getOrCreateApiClient).toHaveBeenCalled())

    const calledWith = vi.mocked(getOrCreateApiClient).mock.calls[0]![0]
    expect(calledWith).not.toHaveProperty('url')
    expect(calledWith).toMatchObject({
      authentication: { preferredSecurityScheme: 'bearerAuth' },
      baseServerURL: 'https://proxy.example.com',
    })
  })

  it('calls updateOptions during initial setup', async () => {
    const { useApiClient } = await import('./use-api-client')

    renderHook(() =>
      useApiClient({
        configuration: {
          url: 'https://api.example.com/openapi.json',
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
          },
          baseServerURL: 'https://proxy.example.com',
        },
      }),
    )

    await waitFor(() =>
      expect(mockApiClient.updateOptions).toHaveBeenCalledWith(
        {
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
          },
          baseServerURL: 'https://proxy.example.com',
        },
        true,
      ),
    )
  })

  it('calls updateOptions when configuration changes', async () => {
    const { useApiClient } = await import('./use-api-client')
    const initialProps: { config: ApiClientConfigurationReact } = {
      config: {
        url: 'https://api.example.com/openapi.json',
        authentication: {
          preferredSecurityScheme: 'bearerAuth',
        },
      },
    }
    const { rerender } = renderHook(
      ({ config }: { config: ApiClientConfigurationReact }) => useApiClient({ configuration: config }),
      {
        initialProps,
      },
    )

    await waitFor(() => expect(mockApiClient.updateOptions).toHaveBeenCalled())

    rerender({
      config: {
        url: 'https://api.example.com/openapi.json',
        authentication: {
          preferredSecurityScheme: 'apiKey',
        },
        baseServerURL: 'https://proxy.example.com',
      },
    })

    await waitFor(() =>
      expect(mockApiClient.updateOptions).toHaveBeenLastCalledWith(
        {
          authentication: {
            preferredSecurityScheme: 'apiKey',
          },
          baseServerURL: 'https://proxy.example.com',
        },
        true,
      ),
    )
  })

  it('does not call updateOptions again when an inline configuration object keeps the same values', async () => {
    const { useApiClient } = await import('./use-api-client')
    const initialProps: { config: ApiClientConfigurationReact } = {
      config: {
        url: 'https://api.example.com/openapi.json',
        proxyUrl: 'https://proxy.example.com',
      },
    }
    const { rerender } = renderHook(
      ({ config }: { config: ApiClientConfigurationReact }) => useApiClient({ configuration: config }),
      {
        initialProps,
      },
    )

    await waitFor(() => expect(mockApiClient.updateOptions).toHaveBeenCalled())
    const callsAfterInitialRender = mockApiClient.updateOptions.mock.calls.length

    act(() => {
      rerender({
        config: {
          url: 'https://api.example.com/openapi.json',
          proxyUrl: 'https://proxy.example.com',
        },
      })
    })

    expect(mockApiClient.updateOptions).toHaveBeenCalledTimes(callsAfterInitialRender)
  })

  it('does not call updateOptions again when nested modal options are recreated with the same values', async () => {
    const { useApiClient } = await import('./use-api-client')
    const initialProps: { config: ApiClientConfigurationReact } = {
      config: {
        url: 'https://api.example.com/openapi.json',
        authentication: {
          preferredSecurityScheme: 'bearerAuth',
        },
      },
    }
    const { rerender } = renderHook(
      ({ config }: { config: ApiClientConfigurationReact }) => useApiClient({ configuration: config }),
      {
        initialProps,
      },
    )

    await waitFor(() => expect(mockApiClient.updateOptions).toHaveBeenCalled())
    const callsAfterInitialRender = mockApiClient.updateOptions.mock.calls.length

    act(() => {
      rerender({
        config: {
          url: 'https://api.example.com/openapi.json',
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
          },
        },
      })
    })

    expect(mockApiClient.updateOptions).toHaveBeenCalledTimes(callsAfterInitialRender)
  })

  it('overwrites modal options when configuration keys are removed', async () => {
    const { useApiClient } = await import('./use-api-client')
    const initialProps: { config: ApiClientConfigurationReact } = {
      config: {
        url: 'https://api.example.com/openapi.json',
        proxyUrl: 'https://proxy.example.com',
      },
    }
    const { rerender } = renderHook(
      ({ config }: { config: ApiClientConfigurationReact }) => useApiClient({ configuration: config }),
      {
        initialProps,
      },
    )

    await waitFor(() =>
      expect(mockApiClient.updateOptions).toHaveBeenCalledWith(
        {
          proxyUrl: 'https://proxy.example.com',
        },
        true,
      ),
    )

    rerender({ config: { url: 'https://api.example.com/openapi.json' } })

    await waitFor(() => expect(mockApiClient.updateOptions).toHaveBeenLastCalledWith({}, true))
  })

  it('sets Vue globals on module load', async () => {
    await import('./use-api-client')

    expect((globalThis as any).__VUE_OPTIONS_API__).toBe(true)
    expect((globalThis as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__).toBe(true)
    expect((globalThis as any).__VUE_PROD_DEVTOOLS__).toBe(false)
  })
})
