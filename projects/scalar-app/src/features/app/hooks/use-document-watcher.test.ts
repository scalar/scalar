import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useDocumentWatcher } from '@/features/app/hooks/use-document-watcher'

const BASE_URL = 'https://example.com'

/**
 * Serves API documents from memory, so the remote source never touches the network.
 *
 * Fake timers replace the global `setTimeout`, which the built-in fetch (undici) relies on too.
 * Since Node 24.19, a real request sent after advancing the fake clock never settles, so going
 * through a local HTTP server made these tests pass or fail depending on the Node version.
 */
const createFetch = (respond: (path: string) => Record<string, unknown> | Response) =>
  vi.fn((input: string | URL | Request): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : input)
    const result = respond(url.pathname)

    return Promise.resolve(result instanceof Response ? result : Response.json(result))
  })

describe('useDocumentWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    return () => {
      vi.clearAllTimers()
      vi.useRealTimers()
      vi.restoreAllMocks()
    }
  })

  it('watch the document and rebase it with the remote source', async () => {
    let showInitial = true

    const fetch = createFetch(() => {
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

    const store = createWorkspaceStore({ fetch })

    await store.addDocument({
      name: 'default',
      url: BASE_URL,
    })

    const defaultDocument = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(defaultDocument)

    // Enable watch mode on the document so the watcher starts polling
    defaultDocument['x-scalar-watch-mode'] = true

    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })

    await vi.advanceTimersByTimeAsync(initialTimeout)
    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('New updated API'), {
      interval: 0,
    })
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
    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('New updated API'), {
      interval: 0,
    })

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
    const calls: Record<string, number> = { a: 0, b: 0 }
    const fetch = createFetch((path) => {
      const name = path === '/a' ? 'a' : 'b'
      calls[name] = (calls[name] ?? 0) + 1
      return {
        openapi: '3.0.0',
        info: { title: `Document ${name.toUpperCase()}${calls[name]}`, version: '1.0.0' },
      }
    })

    const store = createWorkspaceStore({ fetch })

    await store.addDocument({
      name: 'a',
      url: `${BASE_URL}/a`,
    })
    await store.addDocument({
      name: 'b',
      url: `${BASE_URL}/b`,
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
    await vi.waitFor(() => expect(store.workspace.documents['b']?.info?.title).toBe('Document B2'), { interval: 0 })

    expect(store.workspace.documents['a']?.info?.title).toBe('Document A1')
  })

  it('does exponential backoff on failure', async () => {
    let calls = 0
    const fetch = createFetch(() => {
      calls++
      if (calls <= 1) {
        return {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        }
      }

      return new Response('Internal Server Error', { status: 500 })
    })

    const store = createWorkspaceStore({ fetch })

    await store.addDocument({
      name: 'default',
      url: BASE_URL,
    })

    const defaultDocument = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(defaultDocument)
    defaultDocument['x-scalar-watch-mode'] = true

    const rebase = vi.spyOn(store, 'rebaseDocument')
    const initialTimeout = 200
    useDocumentWatcher({ documentName: ref('default'), store, initialTimeout })
    await nextTick()

    await vi.advanceTimersByTimeAsync(initialTimeout)
    // Let the rebase finish without advancing the polling clock.
    await vi.waitFor(() => expect(rebase).toHaveBeenCalledTimes(1), { interval: 0 })
    await rebase.mock.results[0]?.value
    await nextTick()
    expect(fetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(initialTimeout * 2 - 1)
    expect(rebase).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    await vi.waitFor(() => expect(rebase).toHaveBeenCalledTimes(2), { interval: 0 })
    await rebase.mock.results[1]?.value
    await nextTick()
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
