import { beforeEach, describe, expect, it, vi } from 'vitest'

const addWindowListener = vi.fn()
const addDocumentListener = vi.fn()

const createPersistence = () => ({
  meta: { setItem: vi.fn() },
  documents: { setItem: vi.fn() },
  intermediateDocuments: { setItem: vi.fn() },
  originalDocuments: { setItem: vi.fn() },
  overrides: { setItem: vi.fn() },
  history: { setItem: vi.fn() },
  auth: { setItem: vi.fn() },
  workspace: { deleteDocument: vi.fn() },
})

const debounceSpy = vi.fn(() => ({
  execute: vi.fn(),
  cleanup: vi.fn(),
  flush: vi.fn(),
  flushAll: vi.fn(),
}))

vi.mock('@scalar/helpers/general/debounce', () => ({
  debounce: debounceSpy,
}))

vi.mock('@/persistence', () => ({
  createWorkspaceStorePersistence: vi.fn(async () => createPersistence()),
}))

describe('persistence-plugin', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    addWindowListener.mockClear()
    addDocumentListener.mockClear()

    vi.stubGlobal('window', {
      addEventListener: addWindowListener,
    })

    vi.stubGlobal('document', {
      addEventListener: addDocumentListener,
      visibilityState: 'visible',
    })
  })

  it('registers lifecycle listeners once across multiple plugin instances', async () => {
    const { persistencePlugin } = await import('./persistence')

    await persistencePlugin({ workspaceId: 'workspace-1' })
    await persistencePlugin({ workspaceId: 'workspace-2' })

    expect(addWindowListener).toHaveBeenCalledTimes(2)
    expect(addWindowListener).toHaveBeenNthCalledWith(1, 'pagehide', expect.any(Function))
    expect(addWindowListener).toHaveBeenNthCalledWith(2, 'beforeunload', expect.any(Function))
    expect(addDocumentListener).toHaveBeenCalledTimes(1)
    expect(addDocumentListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })

  it('flushes all registered plugin debounces on pagehide', async () => {
    const { persistencePlugin } = await import('./persistence')

    await persistencePlugin({ workspaceId: 'workspace-1' })
    await persistencePlugin({ workspaceId: 'workspace-2' })

    const pagehideHandler = addWindowListener.mock.calls.find((call) => call[0] === 'pagehide')?.[1]
    expect(pagehideHandler).toBeTypeOf('function')

    pagehideHandler()

    const firstPluginDebounce = debounceSpy.mock.results[0]?.value
    const secondPluginDebounce = debounceSpy.mock.results[1]?.value

    expect(firstPluginDebounce.flushAll).toHaveBeenCalledTimes(1)
    expect(secondPluginDebounce.flushAll).toHaveBeenCalledTimes(1)
  })

  it('dispose flushes pending writes and cleans up before removing from pendingFlushes', async () => {
    const { persistencePlugin } = await import('./persistence')

    const plugin = await persistencePlugin({ workspaceId: 'workspace-1' })
    const debounced = debounceSpy.mock.results[0]?.value

    plugin.dispose?.()

    expect(debounced.flushAll).toHaveBeenCalledTimes(1)
  })

  it('dispose removes flushAll from pendingFlushes so only remaining plugins are flushed', async () => {
    const { persistencePlugin } = await import('./persistence')

    const plugin1 = await persistencePlugin({ workspaceId: 'workspace-1' })
    await persistencePlugin({ workspaceId: 'workspace-2' })

    const pagehideHandler = addWindowListener.mock.calls.find((call) => call[0] === 'pagehide')?.[1]
    expect(pagehideHandler).toBeTypeOf('function')

    pagehideHandler()
    expect(debounceSpy).toHaveBeenCalledTimes(2)
    expect(debounceSpy.mock.results[0]?.value.flushAll).toHaveBeenCalledTimes(1)
    expect(debounceSpy.mock.results[1]?.value.flushAll).toHaveBeenCalledTimes(1)

    plugin1.dispose?.()

    debounceSpy.mock.results[0]?.value.flushAll.mockClear()
    debounceSpy.mock.results[1]?.value.flushAll.mockClear()
    pagehideHandler()

    expect(debounceSpy.mock.results[0]?.value.flushAll).not.toHaveBeenCalled()
    expect(debounceSpy.mock.results[1]?.value.flushAll).toHaveBeenCalledTimes(1)
  })
})
