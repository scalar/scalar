import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import {
  deleteSecurityScheme,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
} from '@/mutators/auth'
import type { WorkspaceDocument } from '@/schemas'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { OAuth2Object, SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'

function createDocument(initial?: Partial<WorkspaceDocument>): WorkspaceDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

describe('updateSelectedSecuritySchemes', () => {
  it('initializes document x-scalar-selected-security and sets selected index to 0 when schemes exist', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    const selected: SecurityRequirementObject[] = [{ bearerAuth: [] }]

    await updateSelectedSecuritySchemes(store, store.workspace.activeDocument!, {
      selectedRequirements: selected,
      newSchemes: [],
      meta: { type: 'document' },
    })

    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toEqual({
      selectedIndex: 0,
      selectedSchemes: selected,
    })
  })

  it('appends newly created schemes with unique names and updates selection', async () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
    })
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document,
    })

    const createItems: { name: string; scheme: SecuritySchemeObject }[] = [
      { name: 'ApiKeyAuth', scheme: { type: 'apiKey', in: 'query', name: 'api_key' } },
    ]

    await updateSelectedSecuritySchemes(store, store.workspace.activeDocument!, {
      selectedRequirements: [],
      newSchemes: createItems,
      meta: { type: 'document' },
    })

    const securitySchemes = store.workspace.activeDocument?.components?.securitySchemes
    assert(securitySchemes)

    // A unique name should be generated because ApiKeyAuth already exists
    const names = Object.keys(securitySchemes)
    expect(names).toContain('ApiKeyAuth')
    expect(names).toContain('ApiKeyAuth 1')

    // Selection should include the newly created scheme with empty scopes
    const result = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(result)
    expect(result.selectedSchemes).toEqual([{ 'ApiKeyAuth 1': [] }])

    // Index is initialized to 0 when adding first item
    expect(result.selectedIndex).toBe(0)
  })

  it('preserves a valid selected index', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 1, selectedSchemes: [{ s1: [] }, { s2: [] }] },
    )

    await updateSelectedSecuritySchemes(store, store.workspace.activeDocument!, {
      selectedRequirements: [{ s1: [] }, { s2: [] }],
      newSchemes: [],
      meta: { type: 'document' },
    })

    const result = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(result)
    expect(result.selectedIndex).toBe(1)
    expect(result.selectedSchemes).toEqual([{ s1: [] }, { s2: [] }])
  })

  it('corrects an out-of-bounds selected index to the last available scheme', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 5, selectedSchemes: [{ only: [] }] },
    )

    const nextSelected: SecurityRequirementObject[] = [{ a: [] }, { b: [] }]

    await updateSelectedSecuritySchemes(store, store.workspace.activeDocument!, {
      selectedRequirements: nextSelected,
      newSchemes: [],
      meta: { type: 'document' },
    })

    const result = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(result)
    expect(result.selectedSchemes).toEqual(nextSelected)
    expect(result.selectedIndex).toBe(nextSelected.length - 1)
  })

  it('updates operation-level selection and updates components for created schemes', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({ paths: { '/pets': { get: {} } } }),
    })

    await updateSelectedSecuritySchemes(store, store.workspace.activeDocument!, {
      selectedRequirements: [{ bearerAuth: [] }],
      newSchemes: [
        {
          name: 'BearerAuth',
          scheme: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      ],
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    // Components should include the newly created scheme
    expect(store.workspace.activeDocument?.components?.securitySchemes?.['BearerAuth']).toEqual({
      type: 'http',
      scheme: 'bearer',
    })

    // Operation-level selection should be created and set
    const result = store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/pets', method: 'get' })
    assert(result)
    expect(result.selectedSchemes).toEqual([{ bearerAuth: [] }, { BearerAuth: [] }])
    expect(result.selectedIndex).toBe(0)
  })
})

describe('updateSecurityScheme', () => {
  it('updates apiKey scheme name', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
    })

    updateSecurityScheme(document, {
      name: 'ApiKey',
      payload: {
        type: 'apiKey',
        name: 'X-NEW-KEY',
      },
    })

    const scheme = document.components!.securitySchemes!.ApiKey as Record<string, unknown>
    expect(scheme['name']).toBe('X-NEW-KEY')
  })

  it('updates oauth2 authorizationCode flow fields', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          OAuth: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: '',
                tokenUrl: '',
                scopes: {},
                'x-usePkce': 'no',
                refreshUrl: '',
              },
            },
          },
        },
      },
    })

    updateSecurityScheme(document, {
      name: 'OAuth',
      payload: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://auth',
            tokenUrl: 'https://token',
            'x-usePkce': 'SHA-256',
            scopes: {},
          },
        },
      },
    })

    assert(document.components?.securitySchemes?.OAuth)
    const flow = getResolvedRef(document.components?.securitySchemes?.OAuth as OAuth2Object)?.flows.authorizationCode
    assert(flow)
    expect(flow.authorizationUrl).toBe('https://auth')
    expect(flow.tokenUrl).toBe('https://token')
    expect(flow['x-usePkce']).toBe('SHA-256')
  })

  it('is a no-op when document is null or scheme missing', () => {
    // null document
    updateSecurityScheme(null, { name: 'X', payload: { type: 'http' } })

    // missing scheme
    const document = createDocument({ components: { securitySchemes: {} } })
    updateSecurityScheme(document, { name: 'NotDefined', payload: { type: 'http' } })

    // Nothing to assert beyond no throw and document untouched
    expect(document.components!.securitySchemes).toEqual({})
  })
})

describe('updateSelectedAuthTab', () => {
  it('initializes document extension when missing and sets selected index', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    updateSelectedAuthTab(store, store.workspace.activeDocument!, {
      index: 3,
      meta: { type: 'document' },
    })

    const result = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(result)
    expect(result.selectedIndex).toBe(3)
    expect(result.selectedSchemes).toEqual([])
  })

  it('updates only the selected index and preserves existing schemes', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ s1: [] }] },
    )

    updateSelectedAuthTab(store, store.workspace.activeDocument!, {
      index: 5,
      meta: { type: 'document' },
    })

    const result = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(result)
    expect(result.selectedIndex).toBe(5)
    expect(result.selectedSchemes).toEqual([{ s1: [] }])
  })

  it('sets selected index for an operation target', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({ paths: { '/pets': { get: {} } } }),
    })

    updateSelectedAuthTab(store, store.workspace.activeDocument!, {
      index: 2,
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    const result = store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/pets', method: 'get' })
    assert(result)
    expect(result.selectedIndex).toBe(2)
    expect(result.selectedSchemes).toEqual([])
  })

  it('is a no-op when document is null', () => {
    updateSelectedAuthTab(createWorkspaceStore(), null, { index: 1, meta: { type: 'document' } })
  })

  it('is a no-op when operation target cannot be resolved', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({ paths: {} }),
    })

    updateSelectedAuthTab(store, store.workspace.activeDocument!, {
      index: 1,
      meta: { type: 'operation', path: '/missing', method: 'get' },
    })

    // Root extension should remain undefined since only operation should be targeted
    const result = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: '/missing',
      method: 'get',
    })
    expect(result).toBeUndefined()
  })
})

describe('updateSelectedScopes', () => {
  it('updates scopes for the matching scheme at document level', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({}),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: [] }] },
    )

    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['OAuth'],
      name: 'OAuth',
      scopes: ['read', 'write'],
      meta: { type: 'document' },
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['read', 'write'] })
  })

  it('updates scopes for matching scheme at operation level', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        paths: {
          '/pets': {
            get: {},
          },
        },
      }),
    })

    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ DocScheme: [] }] },
    )

    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ OpOAuth: ['old'] }] },
    )

    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['OpOAuth'],
      name: 'OpOAuth',
      scopes: ['new'],
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    const result = store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/pets', method: 'get' })
    assert(result)
    expect(result.selectedSchemes[0]).toEqual({ OpOAuth: ['new'] })
    const docSchemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(docSchemes)
    expect(docSchemes.selectedSchemes[0]).toEqual({ DocScheme: [] })
  })

  it('matches by id array of keys (multi-scheme requirement) and updates only the named entry', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ a: [], b: [] }, { a: [] }, { b: [] }] },
    )

    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['a', 'b'],
      name: 'a',
      scopes: ['one'],
      meta: { type: 'document' },
    })

    const scheme = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(scheme)
    expect(scheme.selectedSchemes[0]).toEqual({ a: ['one'], b: [] })
  })

  it('is a no-op when document is null', () => {
    updateSelectedScopes(createWorkspaceStore(), null, { id: ['x'], name: 'x', scopes: [], meta: { type: 'document' } })
  })

  it('is a no-op when selected schemes are missing or scheme id not found', async () => {
    const document = createDocument()

    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    // No selected extension yet
    updateSelectedScopes(store, document, {
      id: ['missing'],
      name: 'missing',
      scopes: ['s'],
      meta: { type: 'document' },
    })
    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toBeUndefined()

    // With extension but id does not match
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ z: [] }] },
    )
    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['notZ'],
      name: 'notZ',
      scopes: ['s'],
      meta: { type: 'document' },
    })
    const zSchemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(zSchemes)
    expect(zSchemes.selectedSchemes).toEqual([{ z: [] }])
  })
})

describe('deleteSecurityScheme', () => {
  it('removes schemes from components, document selections, document security, and operations', async () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          A: {
            type: 'http',
            scheme: 'bearer',
          },
          B: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          C: {
            type: 'http',
            scheme: 'basic',
          },
        },
      },
      security: [{ A: [] }, { D: [] }],
      paths: {
        '/p': {
          get: {
            security: [{ A: [] }, { E: [] }],
          },
        },
      },
    })
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document,
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      {
        selectedIndex: 0,
        selectedSchemes: [{ A: [] }, { B: [] }, { C: [] }],
      },
    )
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/p', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ B: [] }, { F: [] }] },
    )

    deleteSecurityScheme(store, store.workspace.activeDocument!, { names: ['A', 'B', 'X'] })

    const components = store.workspace.activeDocument?.components
    // Components
    assert(components?.securitySchemes)
    expect(components.securitySchemes?.A).toBeUndefined()
    expect(components.securitySchemes?.B).toBeUndefined()
    expect(components.securitySchemes?.C).toBeDefined()

    // Document extension selections
    const docSchemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(docSchemes)
    expect(docSchemes.selectedSchemes).toEqual([{ C: [] }])

    // Document security array
    expect(store.workspace.activeDocument?.security).toEqual([{ D: [] }])

    // Operation level filtering
    const op = getResolvedRef(store.workspace.activeDocument?.paths!['/p']?.get)
    assert(op)
    expect(op.security).toEqual([{ E: [] }])
    const opSchemes = store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/p', method: 'get' })
    assert(opSchemes)
    expect(opSchemes.selectedSchemes).toEqual([{ F: [] }])
  })

  it('is a no-op when document is null or components are missing', async () => {
    // null doc
    deleteSecurityScheme(createWorkspaceStore(), null, { names: ['A'] })

    // missing components -> selected security should not be touched due to early return
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ A: [] }, { B: [] }] },
    )
    deleteSecurityScheme(store, store.workspace.activeDocument!, { names: ['A'] })

    const docSchemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(docSchemes)
    expect(docSchemes.selectedSchemes).toEqual([{ A: [] }, { B: [] }])
  })
})
