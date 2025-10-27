import assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'

import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type FastifyInstance, fastify } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useDocumentWatcher } from '@/v2/hooks/use-document-watcher'

describe('useDocumentWatcher', () => {
  let server: FastifyInstance

  const port = 6287
  const url = `http://localhost:${port}`

  beforeEach(() => {
    vi.useFakeTimers()

    server = fastify({ logger: false })
  })

  afterEach(async () => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    await server.close()
    await setTimeout(100)
  })

  it('watch the document and rebase it with the remote source', async () => {
    let showInital = true

    server.get('/', () => {
      if (showInital) {
        showInital = false
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

    useDocumentWatcher({ documentName: ref('default'), store, timeout: 200 })

    vi.advanceTimersByTime(200)
    // Wait for the timer to complete
    await setTimeout(10)

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

    useDocumentWatcher({ documentName: selectedDocument, store, timeout: 200 })

    selectedDocument.value = 'b'
    await setTimeout(10)

    vi.advanceTimersByTime(200)
    // Wait for the timer to complete
    await setTimeout(10)

    expect(store.workspace.documents['a']?.info?.title).toBe('Document A1')
    expect(store.workspace.documents['b']?.info?.title).toBe('Document B2')
  })
})
