import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type FastifyInstance, fastify } from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'

describe('useDocumentWatcher', () => {
  let server: FastifyInstance

  const port = 6287
  const url = `http://localhost:${port}`

  beforeEach(() => {
    vi.useFakeTimers()
    server = fastify({ logger: false })

    return async () => {
      vi.clearAllTimers()
      vi.useRealTimers()
      vi.restoreAllMocks()
      await server.close()
    }
  })

  it('watch the document and rebase it with the remote source', async () => {
    let showInitial = true

    server.get('/', () => {
      if (showInitial) {
        showInitial = false
        return {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        }
      }
      return {
        openapi: '3.1.0',
        info: { title: 'New updated API', version: '1.0.0' },
      }
    })
    await server.listen({ port })

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      url,
    })

    const defaultDocument = store.workspace.documents['default']
    assert(defaultDocument)

    // Enable watch mode on the document so the watcher starts polling
    defaultDocument['x-scalar-watch-mode'] = true

    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })

    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.advanceTimersToNextTimerAsync()

    expect(store.workspace.documents['default']?.info?.title).toBe('New updated API')
  })

  it('only keeps one timeout at a time, and it switches when the document changes', async () => {
    let callsA = 0
    let callsB = 0
    server.get('/a', () => {
      callsA++
      return {
        openapi: '3.0.0',
        info: { title: 'Document A' + callsA, version: '1.0.0' },
      }
    })
    server.get('/b', () => {
      callsB++
      return {
        openapi: '3.0.0',
        info: { title: 'Document B' + callsB, version: '1.0.0' },
      }
    })
    await server.listen({ port })

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'a',
      url: `${url}/a`,
    })
    await store.addDocument({
      name: 'b',
      url: `${url}/b`,
    })

    const documentA = store.workspace.documents['a']
    const documentB = store.workspace.documents['b']
    assert(documentA)
    assert(documentB)

    documentA['x-scalar-watch-mode'] = true
    documentB['x-scalar-watch-mode'] = true

    const selectedDocument = ref<'a' | 'b'>('a')

    const initialTimeout = 200
    useDocumentWatcher({ documentName: selectedDocument, store, initialTimeout })

    selectedDocument.value = 'b'
    await nextTick()

    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.advanceTimersToNextTimerAsync()

    expect(store.workspace.documents['a']?.info?.title).toBe('Document A1')
    expect(store.workspace.documents['b']?.info?.title).toBe('Document B2')
  })

  it('does exponential backoff on failure', async () => {
    let calls = 0
    const fn = vi.fn()
    server.get('/', (_, res) => {
      calls++
      fn()
      if (calls <= 1) {
        return {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        }
      }

      return res.status(500).send('Internal Server Error')
    })
    await server.listen({ port })

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      url,
    })

    const defaultDocument = store.workspace.documents['default']
    assert(defaultDocument)
    defaultDocument['x-scalar-watch-mode'] = true

    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })
    // Wait for the watcher to initialize
    await nextTick()

    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.advanceTimersToNextTimerAsync()

    // Next attempt — triggers exponential backoff
    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.advanceTimersByTimeAsync(initialTimeout * 2)
    await vi.advanceTimersToNextTimerAsync()

    expect(fn).toHaveBeenCalledTimes(3)
  })
})
