import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import type { ApiClientModal } from './helpers/create-api-client-modal'
import { useLazyApiClient } from './use-lazy-api-client'

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.restoreAllMocks()
})

const setup = () => {
  const eventBus = createWorkspaceEventBus()
  const opened = vi.fn()
  const unmount = vi.fn()
  const client = { app: { unmount } } as unknown as ApiClientModal
  const createClient = vi.fn(() => {
    eventBus.on('ui:open:client-modal', opened)
    return client
  })
  let resolve!: (factory: () => ApiClientModal | null) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<() => ApiClientModal | null>((accept, fail) => {
    resolve = accept
    reject = fail
  })
  const deferred = { promise, resolve, reject }
  const load = vi.fn(() => deferred.promise)
  const scope = effectScope()
  scopes.push(scope)
  const result = scope.run(() => useLazyApiClient({ eventBus, load }))!
  return { eventBus, opened, unmount, client, createClient, deferred, load, scope, result }
}

describe('use-lazy-api-client', () => {
  it('does not download or mount the client until an open request', async () => {
    const { load, createClient, result } = setup()
    await flushPromises()
    expect(load).not.toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
    expect(result.value).toBeNull()
  })

  it.each([
    undefined,
    { id: 'pet', exampleName: 'success', requestBodyCompositionSelection: { '/oneOf': 1 } },
    { method: 'get' as const, path: '/pets', exampleName: 'success' },
  ])('delivers the first open payload after the modal subscribes: %j', async (payload) => {
    const { eventBus, opened, deferred, createClient, result, client } = setup()
    eventBus.emit('ui:open:client-modal', payload)
    expect(opened).not.toHaveBeenCalled()
    deferred.resolve(createClient)
    await flushPromises()
    expect(result.value).toBe(client)
    expect(opened).toHaveBeenCalledExactlyOnceWith(payload)
  })

  it('loads once and opens the latest operation when clicked repeatedly during loading', async () => {
    const { eventBus, opened, deferred, createClient, load } = setup()
    eventBus.emit('ui:open:client-modal', { id: 'first' })
    eventBus.emit('ui:open:client-modal', { id: 'second' })
    deferred.resolve(createClient)
    await flushPromises()
    expect(load).toHaveBeenCalledOnce()
    expect(createClient).toHaveBeenCalledOnce()
    expect(opened).toHaveBeenCalledExactlyOnceWith({ id: 'second' })
    eventBus.emit('ui:open:client-modal', { id: 'third' })
    expect(opened).toHaveBeenLastCalledWith({ id: 'third' })
    expect(opened).toHaveBeenCalledTimes(2)
    expect(load).toHaveBeenCalledOnce()
  })

  it('loads independently for reference and agent event buses', async () => {
    const reference = setup()
    const agent = setup()
    agent.eventBus.emit('ui:open:client-modal', { id: 'agent-request' })
    agent.deferred.resolve(agent.createClient)
    await flushPromises()
    expect(agent.opened).toHaveBeenCalledExactlyOnceWith({ id: 'agent-request' })
    expect(reference.load).not.toHaveBeenCalled()

    reference.eventBus.emit('ui:open:client-modal', { id: 'reference-request' })
    reference.deferred.resolve(reference.createClient)
    await flushPromises()
    expect(reference.opened).toHaveBeenCalledExactlyOnceWith({ id: 'reference-request' })
    expect(agent.opened).toHaveBeenCalledOnce()
  })

  it('cancels a pending open on close and allows another open later', async () => {
    const { eventBus, opened, deferred, createClient } = setup()
    eventBus.emit('ui:open:client-modal')
    eventBus.emit('ui:close:client-modal')
    deferred.resolve(createClient)
    await flushPromises()
    expect(createClient).not.toHaveBeenCalled()
    expect(opened).not.toHaveBeenCalled()
    eventBus.emit('ui:open:client-modal', { id: 'retry' })
    await flushPromises()
    expect(opened).toHaveBeenCalledExactlyOnceWith({ id: 'retry' })
  })

  it('does not mount after disposal or react to later open requests', async () => {
    const { eventBus, deferred, createClient, scope, load } = setup()
    eventBus.emit('ui:open:client-modal')
    scope.stop()
    deferred.resolve(createClient)
    await flushPromises()
    eventBus.emit('ui:open:client-modal')
    expect(createClient).not.toHaveBeenCalled()
    expect(load).toHaveBeenCalledOnce()
  })

  it('unmounts an initialized client when its owner is disposed', async () => {
    const { eventBus, deferred, createClient, scope, unmount } = setup()
    eventBus.emit('ui:open:client-modal')
    deferred.resolve(createClient)
    await flushPromises()
    scope.stop()
    expect(unmount).toHaveBeenCalledOnce()
  })

  it('reports a failed download and retries on the next open request', async () => {
    const { eventBus, deferred, createClient, load, opened } = setup()
    const error = new Error('Offline')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    eventBus.emit('ui:open:client-modal')
    deferred.reject(error)
    await flushPromises()
    expect(log).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Could not load'), error)
    expect(createClient).not.toHaveBeenCalled()
    load.mockResolvedValueOnce(createClient)
    eventBus.emit('ui:open:client-modal', { id: 'retry' })
    await flushPromises()
    expect(opened).toHaveBeenCalledExactlyOnceWith({ id: 'retry' })
  })

  it('allows a retry when the mount element was unavailable', async () => {
    const { eventBus, deferred, createClient, load, opened } = setup()
    eventBus.emit('ui:open:client-modal')
    deferred.resolve(() => null)
    await flushPromises()
    load.mockResolvedValueOnce(createClient)
    eventBus.emit('ui:open:client-modal')
    await flushPromises()
    expect(opened).toHaveBeenCalledExactlyOnceWith(undefined)
  })
})
