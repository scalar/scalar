import { getOpenApiServerDocument } from '@test/helpers'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { TraversedEntry } from '@/schemas/navigation'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'
import { createServerWorkspaceStore } from '@/server'

import { traverseDocument } from './traverse-document'

const createDocument = (tags = ['Users', 'Beta', 'Partners']): OpenApiDocument => ({
  openapi: '3.2.1',
  info: { title: 'Tag categories', version: '1.0.0' },
  tags: [
    { name: 'Users', kind: 'nav' },
    { name: 'Beta', kind: 'badge' },
    { name: 'Partners', kind: 'audience' },
  ],
  paths: { '/users': { get: { tags, summary: 'List users', responses: { '200': { description: 'OK' } } } } },
  'x-scalar-original-document-hash': '',
})

const summarize = (entries: TraversedEntry[] = []): unknown[] =>
  entries.flatMap((entry) => {
    if (entry.type === 'text') {
      return []
    }
    return [
      {
        type: entry.type,
        title: entry.title,
        id: entry.id,
        children: summarize('children' in entry ? entry.children : []),
      },
    ]
  })

const operation = (id = 'doc/tag/users/GET/users'): unknown => ({
  type: 'operation',
  title: 'List users',
  id,
  children: [],
})

describe('tag-kinds', () => {
  it('groups mixed categories only under navigation tags', () => {
    const document = createDocument()
    const result = traverseDocument('doc', document)
    expect(summarize(result.children)).toStrictEqual([
      { type: 'tag', title: 'Users', id: 'doc/tag/users', children: [operation()] },
    ])
    expect(getResolvedRef(getResolvedRef(document.paths?.['/users'])?.get)?.tags).toStrictEqual([
      'Users',
      'Beta',
      'Partners',
    ])
  })

  it('keeps label-only operations and webhooks reachable', () => {
    const document = createDocument(['Beta', 'Partners'])
    document.tags = document.tags?.filter((tag) => tag.kind !== 'nav')
    document.webhooks = {
      changed: { post: { tags: ['Beta', 'Partners'], responses: { '200': { description: 'OK' } } } },
    }
    expect(summarize(traverseDocument('doc', document).children)).toStrictEqual([
      operation('doc/GET/users'),
      {
        type: 'tag',
        title: 'Webhooks',
        id: 'doc/webhook/undefined/',
        children: [{ type: 'webhook', title: 'changed', id: 'doc/webhook/POST/changed', children: [] }],
      },
    ])
  })

  it('does not let audience nesting override legacy navigation groups', () => {
    const document = createDocument()
    document.tags?.push({ name: 'External', kind: 'audience' })
    const partners = document.tags?.find((tag) => tag.name === 'Partners')
    if (partners) {
      partners.parent = 'External'
    }
    document['x-tagGroups'] = [{ name: 'API', tags: ['Users', 'Beta', 'Partners'] }]
    expect(summarize(traverseDocument('doc', document).children)).toStrictEqual([
      {
        type: 'tag',
        title: 'API',
        id: 'doc/tag-group/api',
        children: [{ type: 'tag', title: 'Users', id: 'doc/tag/users', children: [operation()] }],
      },
    ])
  })

  it('keeps navigation children of label parents at the top level', () => {
    const document = createDocument()
    document.tags = [
      { name: 'Users', kind: 'nav', parent: 'Partners' },
      { name: 'Partners', kind: 'audience' },
      { name: 'Beta', kind: 'badge' },
    ]
    expect(summarize(traverseDocument('doc', document).children)).toStrictEqual([
      { type: 'tag', title: 'Users', id: 'doc/tag/users', children: [operation()] },
    ])
  })

  it('keeps models with only label tags in the models section', () => {
    const document = createDocument()
    document.components = { schemas: { User: { type: 'object', 'x-tags': ['Beta', 'Partners'] } } }
    expect(summarize(traverseDocument('doc', document).children)).toStrictEqual([
      { type: 'tag', title: 'Users', id: 'doc/tag/users', children: [operation()] },
      {
        type: 'models',
        title: 'Models',
        id: 'doc/models',
        children: [{ type: 'model', title: 'User', id: 'doc/models/User', children: [] }],
      },
    ])
  })

  it('preserves absent, custom and undeclared navigation kinds', () => {
    const document = createDocument(['Users', 'Custom', 'Undeclared'])
    document.tags = [{ name: 'Users' }, { name: 'Custom', kind: 'custom' }]
    expect(summarize(traverseDocument('doc', document).children)).toStrictEqual([
      { type: 'tag', title: 'Users', id: 'doc/tag/users', children: [operation()] },
      { type: 'tag', title: 'Custom', id: 'doc/tag/custom', children: [operation('doc/tag/custom/GET/users')] },
      {
        type: 'tag',
        title: 'Undeclared',
        id: 'doc/tag/undeclared',
        children: [operation('doc/tag/undeclared/GET/users')],
      },
    ])
  })

  it('generates the same category groups in browser and server stores', async () => {
    const input = { name: 'doc', document: createDocument() }
    const client = createWorkspaceStore()
    await client.addDocument(structuredClone(input))
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com',
      documents: [structuredClone(input)],
    })
    const clientNav = client.workspace.documents.doc?.['x-scalar-navigation']
    const serverNav = getOpenApiServerDocument(server, 'doc')?.['x-scalar-navigation']
    expect(summarize(clientNav?.children)).toStrictEqual([
      { type: 'tag', title: 'Users', id: 'doc/tag/users', children: [operation()] },
    ])
    expect(summarize(serverNav?.children)).toStrictEqual(summarize(clientNav?.children))
  })
})
