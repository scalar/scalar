import { assert, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import type { DocumentTypeDefinition } from '@/schemas/plugin-document'
import { isPluginDocument } from '@/schemas/plugin-document'
import { isAsyncApiDocument, isOpenApiDocument } from '@/schemas/type-guards'

const documentType: DocumentTypeDefinition = {
  type: 'workflows',
  detect: (document) => document.format === 'workflows',
  traverse: ({ documentId }) => [
    { id: `${documentId}/workflow/adopt`, title: 'Adopt', type: 'plugin', documentType: 'workflows' },
  ],
}
const openapi = { openapi: '3.1.0', info: { title: 'HTTP', version: '1' }, paths: {} }
const asyncapi = { asyncapi: '3.1.0', info: { title: 'Events', version: '1' }, channels: {} }
const plugin = {
  format: 'workflows',
  info: { title: 'Workflows', version: '1' },
  openapi: '3.1.0',
  asyncapi: '3.1.0',
  paths: { unrelated: 'plugin data' },
  servers: [{ url: 'https://plugin.example.com' }],
}

describe('client.plugin-documents', () => {
  it('classifies misleading fields automatically across save, restore, export, and hydration', async () => {
    const detect = vi.fn(documentType.detect)
    const store = createWorkspaceStore({ documentTypes: [{ ...documentType, detect }] })
    await store.addDocument({ name: 'http', document: openapi })
    await store.addDocument({ name: 'events', document: asyncapi })
    await store.addDocument({ name: 'workflows', document: plugin })

    await store.saveDocument('workflows')
    await store.replaceDocument('workflows', { ...plugin, info: { title: 'Edited', version: '1' } })
    await store.revertDocumentChanges('workflows')
    expect(JSON.parse(store.exportDocument('workflows', 'json') ?? '{}')).toStrictEqual(plugin)

    const restored = createWorkspaceStore({ documentTypes: [{ ...documentType, detect }] })
    detect.mockClear()
    restored.loadWorkspace(store.exportWorkspace())
    // Hydration restores processed state without running third-party ingestion again.
    expect(detect).not.toHaveBeenCalled()
    expect(isOpenApiDocument(restored.workspace.documents.http)).toBe(true)
    expect(isAsyncApiDocument(restored.workspace.documents.events)).toBe(true)
    const document = restored.workspace.documents.workflows
    assert(isPluginDocument(document))
    expect(document['x-scalar-document-type']).toBe('workflows')
    expect(isOpenApiDocument(document)).toBe(false)
    expect(isAsyncApiDocument(document)).toBe(false)
    expect(document.paths).toStrictEqual(plugin.paths)
    expect(document.servers).toStrictEqual(plugin.servers)
    expect(document['x-scalar-navigation']?.children?.map((entry) => entry.id)).toStrictEqual([
      'workflows/workflow/adopt',
    ])

    for (const name of ['http', 'events', 'workflows', 'http']) {
      restored.update('x-scalar-active-document', name)
      expect(restored.workspace.activeDocument?.info.title).toBe(restored.workspace.documents[name]?.info.title)
    }
  })

  it.each([openapi, asyncapi])('ignores source markers when replacing with $info.title', async (document) => {
    const store = createWorkspaceStore({ documentTypes: [documentType] })
    await store.addDocument({ name: 'document', document: plugin })
    await store.replaceDocument('document', { ...document, 'x-scalar-document-type': 'workflows' })
    expect(isPluginDocument(store.workspace.documents.document)).toBe(false)
    expect(isOpenApiDocument(store.workspace.documents.document)).toBe('openapi' in document)
    expect(isAsyncApiDocument(store.workspace.documents.document)).toBe('asyncapi' in document)
    await store.saveDocument('document')
    expect(JSON.parse(store.exportDocument('document', 'json') ?? '{}')['x-scalar-document-type']).toBeUndefined()
  })

  it.each([openapi, plugin])(
    'does not restore HTTP servers when rebasing $info.title into a plugin document',
    async (document) => {
      const store = createWorkspaceStore({ documentTypes: [documentType] })
      await store.addDocument({
        name: 'document',
        document: { ...document, servers: [{ url: 'https://old.example.com' }] },
      })
      await store.saveDocument('document')
      const { servers: _servers, ...upstream } = plugin
      const result = await store.rebaseDocument({
        name: 'document',
        document: { ...upstream, 'x-scalar-document-type': 'untrusted' },
      })
      assert(result.ok)
      await result.applyChanges({ resolvedDocument: { ...upstream, 'x-scalar-document-type': 'untrusted' } })

      const rebased = store.workspace.documents.document
      assert(isPluginDocument(rebased))
      expect(rebased['x-scalar-document-type']).toBe('workflows')
      expect(rebased.servers).toBeUndefined()
      expect(JSON.parse(store.exportDocument('document', 'json') ?? '{}')).toStrictEqual(upstream)
    },
  )
})
