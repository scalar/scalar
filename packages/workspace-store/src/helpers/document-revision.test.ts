import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'
import { toRaw } from 'vue'

import { createWorkspaceStore } from '@/client'
import { unpackDetectChangesProxy } from '@/helpers/detect-changes-proxy'
import { getDocumentRevision } from '@/helpers/document-revision'

const addDocument = async () => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'default',
    document: {
      openapi: '3.1.0',
      info: { title: 'My API', version: '1.0.0' },
      components: { schemas: { User: { type: 'object', properties: { id: { type: 'string' } } } } },
    },
  })

  return { store, document: store.workspace.documents['default']! }
}

describe('getDocumentRevision', () => {
  it('returns 0 for a document no store tracks', () => {
    expect(getDocumentRevision({ openapi: '3.1.0' })).toBe(0)
    expect(getDocumentRevision(createMagicProxy({ openapi: '3.1.0' }))).toBe(0)
  })

  it('returns 0 for a value that is not a document', () => {
    expect(getDocumentRevision(undefined)).toBe(0)
    expect(getDocumentRevision(null)).toBe(0)
    expect(getDocumentRevision('nope')).toBe(0)
  })

  it('moves when a document is mutated through the store', async () => {
    const { document } = await addDocument()
    const before = getDocumentRevision(document)

    document.info.title = 'Renamed'

    expect(getDocumentRevision(document)).toBeGreaterThan(before)
  })

  it('moves when a schema deep in the document is mutated', async () => {
    const { document } = await addDocument()
    const before = getDocumentRevision(document)

    const schemas = (document.components as { schemas?: Record<string, Record<string, unknown>> }).schemas!
    schemas['User']!['title'] = 'User'

    expect(getDocumentRevision(document)).toBeGreaterThan(before)
  })

  it('does not move while the document is only read', async () => {
    const { document } = await addDocument()
    document.info.title = 'Renamed'
    const after = getDocumentRevision(document)

    expect(document.info.title).toBe('Renamed')
    expect((document.components as { schemas?: Record<string, unknown> }).schemas?.['User']).toBeDefined()
    expect(JSON.stringify(document.info)).toContain('Renamed')

    expect(getDocumentRevision(document)).toBe(after)
  })

  it('reads the same revision through a view with the write-oriented proxies stripped', async () => {
    // What the API reference holds while rendering a schema: the reactive and detect-changes layers
    // peeled off for reads, the magic and overrides layers kept.
    const { document } = await addDocument()
    const unwrapped = unpackDetectChangesProxy(toRaw(document))
    document.info.title = 'Renamed'

    expect(getDocumentRevision(unwrapped)).toBe(getDocumentRevision(document))
    expect(getDocumentRevision(unwrapped)).toBeGreaterThan(0)
  })

  it('tracks each document separately', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'a', document: { openapi: '3.1.0', info: { title: 'A', version: '1' } } })
    await store.addDocument({ name: 'b', document: { openapi: '3.1.0', info: { title: 'B', version: '1' } } })

    const a = store.workspace.documents['a']!
    const b = store.workspace.documents['b']!
    const revisionOfB = getDocumentRevision(b)

    a.info.title = 'Renamed'

    expect(getDocumentRevision(b)).toBe(revisionOfB)
  })
})
