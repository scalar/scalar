import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadDocumentFromSource as commandImport } from '@/features/command-palette/helpers/load-document-from-source'
import { loadDocumentFromSource as listenerImport } from '@/features/import-listener/helpers/load-document-from-source'

import { loadDocumentFromUrl } from './load-document-from-url'

const document = { openapi: '3.1.0', info: { title: 'Local Hono API', version: '1.0.0' }, paths: {} }
const origin = 'http://localhost:3000'
const html = '<script>Scalar.createApiReference("#app", {"url": "/openapi.json"})</script>'

describe('load-document-from-url', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([commandImport, listenerImport])('imports a reference through the configured transport', async (load) => {
    const fetch = vi.fn<typeof globalThis.fetch>((input) =>
      Promise.resolve(input.toString() === `${origin}/reference` ? new Response(html) : Response.json(document)),
    )
    const globalFetch = vi.fn<typeof globalThis.fetch>()
    vi.stubGlobal('fetch', globalFetch)
    const store = createWorkspaceStore({ fetch })

    expect(await load(store, { type: 'url', source: `${origin}/reference` }, 'hono', true, fetch)).toBe(true)
    expect(store.workspace.documents.hono?.info.title).toBe('Local Hono API')
    expect(store.workspace.documents.hono?.['x-scalar-original-source-url']).toBe(`${origin}/openapi.json`)
    expect(store.workspace.documents.hono?.['x-scalar-watch-mode']).toBe(true)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([`${origin}/reference`, `${origin}/openapi.json`])
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('uses the active proxy for discovery and the discovered document', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (input) =>
      input.toString().includes('reference') ? new Response(html) : Response.json(document),
    )
    vi.stubGlobal('fetch', fetch)
    const store = createWorkspaceStore({ meta: { 'x-scalar-active-proxy': 'https://proxy.example.com' } })

    expect(await loadDocumentFromUrl(store, 'https://api.example.com/reference', 'api', false)).toBe(true)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://proxy.example.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Freference',
      'https://proxy.example.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Fopenapi.json',
    ])
  })

  it('imports a direct document URL without discovery requests', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(document))
    const store = createWorkspaceStore({ fetch })

    expect(await loadDocumentFromUrl(store, ` ${origin}/openapi.json `, 'api', false, fetch)).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(store.workspace.documents.api?.['x-scalar-watch-mode']).toBe(false)
  })

  it('imports extensionless JSON and YAML endpoints', async () => {
    for (const content of [
      JSON.stringify(document),
      'openapi: 3.1.0\ninfo:\n  title: Local Hono API\n  version: 1.0.0\npaths: {}',
    ]) {
      const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(content))
      const store = createWorkspaceStore({ fetch })

      expect(await loadDocumentFromUrl(store, `${origin}/document`, 'api', true, fetch)).toBe(true)
      expect(store.workspace.documents.api?.info.title).toBe('Local Hono API')
      expect(store.workspace.documents.api?.['x-scalar-original-source-url']).toBe(`${origin}/document`)
    }
  })

  it('imports an embedded document without enabling URL watch mode', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(`<script id="api-reference" type="application/json">${JSON.stringify(document)}</script>`),
    )
    const store = createWorkspaceStore({ fetch })

    expect(await loadDocumentFromUrl(store, `${origin}/reference`, 'api', true, fetch)).toBe(true)
    expect(store.workspace.documents.api?.info.title).toBe('Local Hono API')
    expect(store.workspace.documents.api?.['x-scalar-watch-mode']).toBeUndefined()
  })

  it('rejects HTML without a document', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('<html>No API here</html>'))
    const store = createWorkspaceStore({ fetch })

    expect(await loadDocumentFromUrl(store, `${origin}/reference`, 'api', false, fetch)).toBe(false)
  })

  it('keeps failed requests on the custom transport', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 404 }))
    const globalFetch = vi.fn<typeof globalThis.fetch>()
    vi.stubGlobal('fetch', globalFetch)
    const store = createWorkspaceStore({ fetch })

    expect(await loadDocumentFromUrl(store, `${origin}/reference`, 'api', false, fetch)).toBe(false)
    expect(globalFetch).not.toHaveBeenCalled()
  })
})
