import { generateHash } from '@scalar/helpers/string/generate-hash'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { describe, expect, it } from 'vitest'

import { createSearchIndex } from '@/features/Search/helpers/create-search-index'

import { normalizeConfigurations } from './normalize-configurations'
import { updateDocumentTitle } from './update-document-title'

const document = {
  openapi: '3.1.0',
  info: { title: 'Example', version: '1.0' },
  servers: [{ url: 'https://first.example' }, { url: 'https://second.example' }],
  paths: { '/hello': { get: { summary: 'Hello', responses: { '200': { description: 'OK' } } } } },
  components: { securitySchemes: { token: { type: 'http', scheme: 'bearer' } } },
}

const normalize = (content: Record<string, unknown>): ReturnType<typeof normalizeConfigurations>[string] =>
  normalizeConfigurations({ slug: 'example', content }).example!

const setup = async (
  content: Record<string, unknown> = document,
): Promise<{
  store: ReturnType<typeof createWorkspaceStore>
  client: ReturnType<typeof createWorkspaceStore>
}> => {
  const store = createWorkspaceStore()
  const client = createWorkspaceStore()
  await store.addDocument({ name: 'example', document: content })
  await client.addDocument({ name: 'example', document: content })
  return { store, client }
}

describe('update-document-title', () => {
  it('updates repeated titles, snapshots, exports, navigation and both stores without replacing operations', async () => {
    const { store, client } = await setup()
    const referenceDocument = store.workspace.documents.example!
    const clientDocument = client.workspace.documents.example!
    if (!isOpenApiDocument(clientDocument)) {
      throw new Error('Expected an OpenAPI client document')
    }
    const operation = getResolvedRef(clientDocument.paths?.['/hello'])?.get
    if (!operation) {
      throw new Error('Expected the imported operation')
    }
    operation.summary = 'Client request edit'
    client.updateDocument('example', 'x-scalar-selected-server', 'https://second.example')
    client.auth.setAuthSecrets('example', 'token', { type: 'http', 'x-scalar-secret-token': 'secret' })
    client.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'example' },
      { selectedIndex: 0, selectedSchemes: [{ token: [] }] },
    )
    const authBefore = JSON.stringify(client.auth.export())
    let previous = document
    for (const title of ['Renamed', 'Another title', '  ']) {
      const updated = { ...previous, info: { ...previous.info, title } }
      expect(updateDocumentTitle(normalize(updated), normalize(previous), store, client)).toBe(true)
      expect(referenceDocument.info.title).toBe(title)
      expect(clientDocument.info.title).toBe(title)
      expect(store.getOriginalDocument('example')?.info).toStrictEqual(updated.info)
      expect(store.getIntermediateDocument('example')?.info).toStrictEqual(updated.info)
      expect(referenceDocument['x-scalar-navigation']?.title).toBe(title.trim() || 'Untitled Document')
      expect(clientDocument['x-scalar-navigation']?.title).toBe(title.trim() || 'Untitled Document')
      expect(referenceDocument['x-scalar-original-document-hash']).toBe(generateHash(JSON.stringify(updated)))
      expect(store.workspace.documents.example).toBe(referenceDocument)
      expect(client.workspace.documents.example).toBe(clientDocument)
      expect(getResolvedRef(clientDocument.paths?.['/hello'])?.get?.summary).toBe('Client request edit')
      expect(clientDocument['x-scalar-selected-server']).toBe('https://second.example')
      expect(JSON.parse(store.exportDocument('example', 'json') ?? '{}').info).toStrictEqual(updated.info)
      expect(JSON.stringify(client.auth.export())).toBe(authBefore)
      previous = updated
    }
    expect(document.info.title).toBe('Example')
    referenceDocument.info.title = 'Local edit'
    expect(store.getOriginalDocument('example')?.info).toStrictEqual({ title: '  ', version: '1.0' })
    expect(clientDocument.info.title).toBe('  ')
  })

  it('does not change example values that share the old info object', async () => {
    const previous = {
      ...document,
      components: { ...document.components, examples: { metadata: { value: document.info } } },
    }
    const { store, client } = await setup(previous)
    const updated = { ...previous, info: { ...previous.info, title: 'Renamed' } }
    expect(updateDocumentTitle(normalize(updated), normalize(previous), store, client)).toBe(true)
    const imported = createWorkspaceStore()
    await imported.addDocument({ name: 'example', document: updated })
    const live = store.workspace.documents.example
    const expected = imported.workspace.documents.example
    if (!isOpenApiDocument(live) || !isOpenApiDocument(expected)) {
      throw new Error('Expected OpenAPI documents')
    }
    expect(getResolvedRef(live.components?.examples?.metadata)?.value).toStrictEqual(document.info)
    expect(getResolvedRef(live.components?.examples?.metadata)?.value).toStrictEqual(
      getResolvedRef(expected.components?.examples?.metadata)?.value,
    )
    expect(store.getOriginalDocument('example')).toStrictEqual(imported.getOriginalDocument('example'))
    expect(createSearchIndex(live)).toStrictEqual(createSearchIndex(expected))
  })

  it('keeps other documents independent and falls back for a subsequent structural edit', async () => {
    const { store, client } = await setup()
    await store.addDocument({ name: 'other', document })
    const updated = { ...document, info: { ...document.info, title: 'Renamed' } }
    expect(updateDocumentTitle(normalize(updated), normalize(document), store, client)).toBe(true)
    const structuralEdit = { ...updated, paths: {} }
    expect(updateDocumentTitle(normalize(structuralEdit), normalize(updated), store, client)).toBe(false)
    await store.addDocument({ name: 'example', document: structuralEdit })
    expect(store.workspace.documents.example?.info.title).toBe('Renamed')
    expect(store.workspace.documents.other?.info.title).toBe('Example')
  })

  it.each([
    { info: { title: 'Renamed', version: '2.0' } },
    { info: { title: null, version: '1.0' } },
    { openapi: '3.2.0', info: { title: 'Renamed', version: '1.0' } },
    { paths: {}, info: { title: 'Renamed', version: '1.0' } },
  ])('uses full import for changes beyond a supported title: %j', async (change) => {
    const { store, client } = await setup()
    expect(updateDocumentTitle(normalize({ ...document, ...change }), normalize(document), store, client)).toBe(false)
    expect(store.workspace.documents.example?.info.title).toBe('Example')
  })

  it.each(['#/info', '#/info/title', '#/%69nfo/title', '#', 'https://example.com/schema.json'])(
    'falls back when references could depend on metadata: %s',
    async ($ref) => {
      const { store, client } = await setup()
      const previous = { ...document, 'x-reference': { $ref } }
      const updated = { ...previous, info: { ...document.info, title: 'Renamed' } }
      expect(updateDocumentTitle(normalize(updated), normalize(previous), store, client)).toBe(false)
    },
  )

  it('allows internal schema references and OpenAPI 3.0 titles', async () => {
    const previous = {
      ...document,
      openapi: '3.0.4',
      components: { ...document.components, schemas: { Message: { type: 'string' } } },
      'x-reference': { $ref: '#/components/schemas/Message' },
    }
    const { store, client } = await setup(previous)
    const updated = { ...previous, info: { ...previous.info, title: 'Renamed' } }
    expect(updateDocumentTitle(normalize(updated), normalize(previous), store, client)).toBe(true)
  })

  it('preserves recursive schema anchors and rejects anchors that contain the edited title', async () => {
    const previous = {
      ...document,
      components: {
        ...document.components,
        schemas: { Item: { $dynamicAnchor: 'item', properties: { child: { $dynamicRef: '#item' } } } },
      },
    }
    const { store, client } = await setup(previous)
    const updated = { ...previous, info: { ...previous.info, title: 'Renamed' } }
    expect(updateDocumentTitle(normalize(updated), normalize(previous), store, client)).toBe(true)

    for (const unsafe of [
      { ...document, $anchor: 'metadata', 'x-reference': { $ref: '#metadata' } },
      {
        ...document,
        info: { ...document.info, 'x-schema': { $dynamicAnchor: 'metadata' } },
        'x-reference': { $dynamicRef: '#metadata' },
      },
    ]) {
      const stores = await setup(unsafe)
      expect(
        updateDocumentTitle(
          normalize({ ...unsafe, info: { ...unsafe.info, title: 'Renamed' } }),
          normalize(unsafe),
          stores.store,
          stores.client,
        ),
      ).toBe(false)
    }
  })

  it('falls back for source identity, configuration, unloaded documents and diverged baselines', async () => {
    const { store, client } = await setup()
    const previous = normalize(document)
    const updated = normalize({ ...document, info: { ...document.info, title: 'Renamed' } })
    expect(updateDocumentTitle(updated, undefined, store, client)).toBe(false)
    expect(updateDocumentTitle(updated, { ...previous, slug: 'other' }, store, client)).toBe(false)
    expect(
      updateDocumentTitle({ ...updated, config: { ...updated.config, hideModels: true } }, previous, store, client),
    ).toBe(false)
    expect(updateDocumentTitle(updated, previous, createWorkspaceStore(), client)).toBe(false)
    store.workspace.documents.example!.info.title = 'Local edit'
    expect(updateDocumentTitle(updated, previous, store, client)).toBe(false)
  })
})
