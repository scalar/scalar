import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { type Server, createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { type VueWrapper, mount } from '@vue/test-utils'
import { afterEach, assert, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

import { useDocumentWatcher } from '@/features/app/hooks/use-document-watcher'

const createDocument = (title: string): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title, version: '1.0.0' },
  paths: {},
})

describe('use-document-watcher', () => {
  let wrapper: VueWrapper | undefined
  let server: Server | undefined
  let directory: string | undefined

  const mountWatcher = (params: Parameters<typeof useDocumentWatcher>[0]): void => {
    wrapper = mount(
      defineComponent({
        setup: () => {
          useDocumentWatcher(params)
          return () => null
        },
      }),
    )
  }

  afterEach(async () => {
    wrapper?.unmount()
    wrapper = undefined
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    if (server) {
      const activeServer = server
      await new Promise<void>((resolve, reject) => {
        activeServer.close((error) => (error ? reject(error) : resolve()))
      })
    }
    server = undefined
    if (directory) {
      await rm(directory, { recursive: true, force: true })
      directory = undefined
    }
  })

  it('rebases the document with the remote source', async () => {
    vi.useFakeTimers()
    let title = 'My API'
    // In-memory responses keep the polling clock independent of socket timers.
    const store = createWorkspaceStore({ fetch: () => Promise.resolve(Response.json(createDocument(title))) })
    await store.addDocument({ name: 'default', url: 'https://example.com/openapi.json' })
    const document = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(document)
    document['x-scalar-watch-mode'] = true
    title = 'New updated API'

    const initialTimeout = 200
    mountWatcher({ documentName: ref('default'), store, initialTimeout })

    await vi.advanceTimersByTimeAsync(initialTimeout - 1)
    expect(store.workspace.documents['default']?.info?.title).toBe('My API')
    await vi.advanceTimersByTimeAsync(1)
    expect(store.workspace.documents['default']?.info?.title).toBe('New updated API')
  })

  it('rebases a document over HTTP with real timers', async () => {
    let title = 'My API'
    server = createServer((_request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(createDocument(title)))
    })
    const activeServer = server
    await new Promise<void>((resolve) => activeServer.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'default', url })
    const document = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(document)
    document['x-scalar-watch-mode'] = true
    title = 'New updated API'

    mountWatcher({ documentName: ref('default'), store, initialTimeout: 20 })

    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('New updated API'))
  })

  it('watches documents imported from a local file path through the file loader', async () => {
    directory = await mkdtemp(join(tmpdir(), 'scalar-document-watcher-'))
    const filePath = join(directory, 'openapi.json')
    await writeFile(filePath, JSON.stringify(createDocument('My API')))

    // Reads files from disk like the desktop app's file loader (which goes through IPC).
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
    await store.addDocument({ name: 'default', path: filePath })
    const document = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(document)
    document['x-scalar-watch-mode'] = true
    await writeFile(filePath, JSON.stringify(createDocument('New updated API')))

    mountWatcher({ documentName: ref('default'), store, initialTimeout: 20 })

    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('New updated API'))
  })

  it('keeps polling when the rebase throws while the source file is missing', async () => {
    directory = await mkdtemp(join(tmpdir(), 'scalar-document-watcher-'))
    const filePath = join(directory, 'openapi.json')
    await writeFile(filePath, JSON.stringify(createDocument('My API')))

    // A loader that throws on read errors, like an IPC readFile rejection in the desktop app.
    const fileLoader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: async (path) => {
        const contents = await readFile(path, 'utf-8')
        return { ok: true, data: JSON.parse(contents), raw: contents }
      },
    }
    const store = createWorkspaceStore({ fileLoader })
    await store.addDocument({ name: 'default', path: filePath })
    const document = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(document)
    document['x-scalar-watch-mode'] = true
    await rm(filePath)
    const rebase = vi.spyOn(store, 'rebaseDocument')

    mountWatcher({ documentName: ref('default'), store, initialTimeout: 20 })

    await vi.waitFor(() => expect(rebase).toHaveBeenCalled())
    await expect(rebase.mock.results[0]?.value).rejects.toHaveProperty('code', 'ENOENT')
    await writeFile(filePath, JSON.stringify(createDocument('Regenerated API')))
    await vi.waitFor(() => expect(store.workspace.documents['default']?.info?.title).toBe('Regenerated API'))
  })

  it('only polls the selected document when the document changes', async () => {
    vi.useFakeTimers()
    const calls: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        const name = new URL(input.toString()).pathname.slice(1)
        calls.push(name)
        const count = calls.filter((call) => call === name).length
        return Promise.resolve(Response.json(createDocument(`Document ${name.toUpperCase()}${count}`)))
      },
    })
    await store.addDocument({ name: 'a', url: 'https://example.com/a' })
    await store.addDocument({ name: 'b', url: 'https://example.com/b' })
    const documentA = store.workspace.documents['a'] as OpenApiDocument | undefined
    const documentB = store.workspace.documents['b'] as OpenApiDocument | undefined
    assert(documentA)
    assert(documentB)
    documentA['x-scalar-watch-mode'] = true
    documentB['x-scalar-watch-mode'] = true
    const selectedDocument = ref('a')
    const initialTimeout = 200
    mountWatcher({ documentName: selectedDocument, store, initialTimeout })

    selectedDocument.value = 'b'
    await nextTick()
    await vi.advanceTimersByTimeAsync(initialTimeout)

    expect(calls).toStrictEqual(['a', 'b', 'b'])
    expect(store.workspace.documents['a']?.info?.title).toBe('Document A1')
    expect(store.workspace.documents['b']?.info?.title).toBe('Document B2')
    expect(vi.getTimerCount()).toBe(1)
  })

  it('backs off after failures and resets the delay after an unchanged response', async () => {
    vi.useFakeTimers()
    const store = createWorkspaceStore({ fetch: () => Promise.resolve(Response.json(createDocument('My API'))) })
    await store.addDocument({ name: 'default', url: 'https://example.com/openapi.json' })
    const document = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(document)
    document['x-scalar-watch-mode'] = true
    type RebaseResult = Awaited<ReturnType<WorkspaceStore['rebaseDocument']>>
    let resolveRebase: ((result: RebaseResult) => void) | undefined
    const rebase = vi.spyOn(store, 'rebaseDocument').mockImplementation(
      () =>
        new Promise<RebaseResult>((resolve) => {
          resolveRebase = resolve
        }),
    )
    const initialTimeout = 200
    mountWatcher({ documentName: ref('default'), store, initialTimeout })

    await vi.advanceTimersByTimeAsync(initialTimeout - 1)
    expect(rebase).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(rebase).toHaveBeenCalledExactlyOnceWith({ name: 'default', url: 'https://example.com/openapi.json' })

    // A slow request must finish before the next polling delay starts.
    await vi.advanceTimersByTimeAsync(1000)
    expect(rebase).toHaveBeenCalledTimes(1)
    assert(resolveRebase)
    resolveRebase({ ok: false, type: 'FETCH_FAILED', message: 'Fetch failed' })
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(initialTimeout * 2 - 1)
    expect(rebase).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(rebase).toHaveBeenCalledTimes(2)

    resolveRebase({ ok: false, type: 'FETCH_FAILED', message: 'Fetch failed' })
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(initialTimeout * 4 - 1)
    expect(rebase).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(rebase).toHaveBeenCalledTimes(3)

    resolveRebase({ ok: false, type: 'NO_CHANGES_DETECTED', message: 'No changes' })
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(initialTimeout - 1)
    expect(rebase).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(1)
    expect(rebase).toHaveBeenCalledTimes(4)
    resolveRebase({ ok: false, type: 'NO_CHANGES_DETECTED', message: 'No changes' })
    await vi.advanceTimersByTimeAsync(0)
  })

  it('stops polling when the component unmounts', async () => {
    vi.useFakeTimers()
    const store = createWorkspaceStore({ fetch: () => Promise.resolve(Response.json(createDocument('My API'))) })
    await store.addDocument({ name: 'default', url: 'https://example.com/openapi.json' })
    const document = store.workspace.documents['default'] as OpenApiDocument | undefined
    assert(document)
    document['x-scalar-watch-mode'] = true
    const rebase = vi.spyOn(store, 'rebaseDocument')
    const initialTimeout = 200
    mountWatcher({ documentName: ref('default'), store, initialTimeout })
    await vi.advanceTimersByTimeAsync(initialTimeout)
    expect(rebase).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)

    assert(wrapper)
    wrapper.unmount()
    wrapper = undefined
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(initialTimeout * 2)
    expect(rebase).toHaveBeenCalledTimes(1)
  })
})
