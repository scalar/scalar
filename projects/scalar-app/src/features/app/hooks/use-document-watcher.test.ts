import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type FastifyInstance, fastify } from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useDocumentWatcher } from '@/features/app/hooks/use-document-watcher'

describe('useDocumentWatcher', () => {
  let server: FastifyInstance
  let url: string

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
    await server.listen({ port: 0 })
    url = `http://localhost:${(server.server.address() as AddressInfo).port}`

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      url,
    })

    const defaultDocument = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(defaultDocument)

    // Enable watch mode on the document so the watcher starts polling
    defaultDocument['x-scalar-watch-mode'] = true

    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })

    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.advanceTimersToNextTimerAsync()

    expect(store.workspace.documents['default']?.info?.title).toBe('New updated API')
  })

  it('watches documents imported from a local file path through the file loader', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-document-watcher-'))
    const filePath = join(directory, 'openapi.json')
    await writeFile(
      filePath,
      JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'My API', version: '1.0.0' },
      }),
    )

    // Reads files from disk like the desktop app's file loader (which goes through IPC)
    const fileLoader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: async (path) => {
        try {
          const contents = await readFile(path, 'utf-8')
          return { ok: true, data: JSON.parse(contents), raw: contents }
        } catch {
          return { ok: false }
        }
      },
    }

    const store = createWorkspaceStore({ fileLoader })

    await store.addDocument({
      name: 'default',
      path: filePath,
    })

    const defaultDocument = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(defaultDocument)

    // Enable watch mode on the document so the watcher starts polling
    defaultDocument['x-scalar-watch-mode'] = true

    // Update the file on disk
    await writeFile(
      filePath,
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'New updated API', version: '1.0.0' },
      }),
    )

    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })

    await vi.advanceTimersByTimeAsync(initialTimeout)

    // File reads resolve on the real event loop, so wait for the rebase to land
    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('New updated API'))

    await rm(directory, { recursive: true, force: true })
  })

  it('keeps polling when the rebase throws, e.g. while the source file is missing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-document-watcher-'))
    const filePath = join(directory, 'openapi.json')
    await writeFile(
      filePath,
      JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'My API', version: '1.0.0' },
      }),
    )

    // A loader that throws on read errors, like the IPC readFile rejection in the desktop app
    const fileLoader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: async (path) => {
        const contents = await readFile(path, 'utf-8')
        return { ok: true, data: JSON.parse(contents), raw: contents }
      },
    }

    const store = createWorkspaceStore({ fileLoader })

    await store.addDocument({
      name: 'default',
      path: filePath,
    })

    const defaultDocument = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(defaultDocument)
    defaultDocument['x-scalar-watch-mode'] = true

    // Delete the source file so the first polls reject (e.g. a build wiped the generated spec)
    await rm(filePath)

    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })

    // First poll throws — the watcher must survive and back off
    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.advanceTimersToNextTimerAsync()

    // The file reappears with new content (e.g. the build regenerated it)
    await writeFile(
      filePath,
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Regenerated API', version: '1.0.0' },
      }),
    )

    // The next scheduled poll picks up the new content
    await vi.advanceTimersByTimeAsync(initialTimeout * 2)
    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('Regenerated API'))

    await rm(directory, { recursive: true, force: true })
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
    await server.listen({ port: 0 })
    url = `http://localhost:${(server.server.address() as AddressInfo).port}`

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'a',
      url: `${url}/a`,
    })
    await store.addDocument({
      name: 'b',
      url: `${url}/b`,
    })

    const documentA = store.workspace.documents['a'] as OpenApiDocument | undefined
    const documentB = store.workspace.documents['b'] as OpenApiDocument | undefined
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
    await server.listen({ port: 0 })
    url = `http://localhost:${(server.server.address() as AddressInfo).port}`

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      url,
    })

    const defaultDocument = store.workspace.documents['default'] as OpenApiDocument | undefined
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
