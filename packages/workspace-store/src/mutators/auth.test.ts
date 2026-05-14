import { getActiveOpenApiDocument } from '@test/helpers'
import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import {
  authMutatorsFactory,
  deleteScope,
  deleteSecurityScheme,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
  upsertScope,
} from '@/mutators/auth'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { OAuth2Object, SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'

function createDocument(initial?: Partial<OpenApiDocument>): OpenApiDocument {
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

    const securitySchemes = getActiveOpenApiDocument(store)?.components?.securitySchemes
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
    expect(getActiveOpenApiDocument(store)?.components?.securitySchemes?.['BearerAuth']).toEqual({
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

describe('clearSelectedSecuritySchemes', () => {
  it('clears document-level selected schemes when meta.type is document', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ BearerAuth: [] }] },
    )

    const mutators = authMutatorsFactory({
      store,
      document: store.workspace.activeDocument ?? null,
    })
    mutators.clearSelectedSecuritySchemes({ meta: { type: 'document' } })

    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toBeUndefined()
  })

  it('clears operation-level selected schemes when meta.type is operation', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({ paths: { '/pets': { get: {} } } }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ ApiKeyAuth: [] }] },
    )

    const mutators = authMutatorsFactory({
      store,
      document: store.workspace.activeDocument ?? null,
    })
    mutators.clearSelectedSecuritySchemes({ meta: { type: 'operation', path: '/pets', method: 'get' } })

    expect(
      store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/pets', method: 'get' }),
    ).toBeUndefined()
  })

  it('is a no-op when document is null', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ BearerAuth: [] }] },
    )

    const mutators = authMutatorsFactory({ store, document: null })
    mutators.clearSelectedSecuritySchemes({ meta: { type: 'document' } })

    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ BearerAuth: [] }],
    })
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

  it('updates openIdConnect discovery url', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          OpenIDConnect: {
            type: 'openIdConnect',
            openIdConnectUrl: 'https://issuer.example.com/.well-known/openid-configuration',
          },
        },
      },
    })

    updateSecurityScheme(document, {
      name: 'OpenIDConnect',
      payload: {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://new-issuer.example.com/.well-known/openid-configuration',
      },
    })

    const scheme = document.components!.securitySchemes!.OpenIDConnect as Record<string, unknown>
    expect(scheme['openIdConnectUrl']).toBe('https://new-issuer.example.com/.well-known/openid-configuration')
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

describe('clearSecuritySchemeSecrets', () => {
  it('replaces openIdConnect flow keys when replace is requested', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    const mutators = authMutatorsFactory({
      store,
      document: store.workspace.activeDocument ?? null,
    })

    mutators.updateSecuritySchemeSecrets({
      name: 'OpenIDConnect',
      overwrite: true,
      payload: {
        type: 'openIdConnect',
        authorizationCode: {
          authorizationUrl: 'https://issuer-a.example.com/authorize',
          tokenUrl: 'https://issuer-a.example.com/token',
          scopes: { openid: '' },
          refreshUrl: '',
          'x-usePkce': 'no',
          'x-scalar-secret-token': '',
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
          'x-scalar-secret-redirect-uri': '',
        },
        implicit: {
          authorizationUrl: 'https://issuer-a.example.com/authorize',
          scopes: { profile: '' },
          refreshUrl: '',
          'x-scalar-secret-token': '',
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-redirect-uri': '',
        },
      },
    })

    mutators.updateSecuritySchemeSecrets({
      name: 'OpenIDConnect',
      overwrite: true,
      payload: {
        type: 'openIdConnect',
        authorizationCode: {
          authorizationUrl: 'https://issuer-b.example.com/authorize',
          tokenUrl: 'https://issuer-b.example.com/token',
          scopes: { email: '' },
          refreshUrl: '',
          'x-usePkce': 'SHA-256',
          'x-scalar-secret-token': '',
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
          'x-scalar-secret-redirect-uri': '',
        },
      },
    })

    expect(store.auth.getAuthSecrets(documentName, 'OpenIDConnect')).toEqual({
      type: 'openIdConnect',
      authorizationCode: {
        authorizationUrl: 'https://issuer-b.example.com/authorize',
        tokenUrl: 'https://issuer-b.example.com/token',
        scopes: { email: '' },
        refreshUrl: '',
        'x-usePkce': 'SHA-256',
        'x-scalar-secret-token': '',
        'x-scalar-secret-client-id': '',
        'x-scalar-secret-client-secret': '',
        'x-scalar-secret-redirect-uri': '',
      },
    })
  })

  it('clears secrets for a security scheme through authMutatorsFactory', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })

    store.auth.setAuthSecrets(documentName, 'OpenIDConnect', {
      type: 'openIdConnect',
      authorizationCode: {
        authorizationUrl: 'https://issuer.example.com/authorize',
        tokenUrl: 'https://issuer.example.com/token',
        refreshUrl: '',
        scopes: { openid: '' },
        'x-usePkce': 'no',
        'x-scalar-secret-token': '',
        'x-scalar-secret-client-id': 'client-id',
        'x-scalar-secret-client-secret': 'client-secret',
        'x-scalar-secret-redirect-uri': 'https://app.example.com/callback',
      },
    })

    const mutators = authMutatorsFactory({
      store,
      document: store.workspace.activeDocument ?? null,
    })

    expect(store.auth.getAuthSecrets(documentName, 'OpenIDConnect')).toBeTruthy()
    mutators.clearSecuritySchemeSecrets({ name: 'OpenIDConnect' })
    expect(store.auth.getAuthSecrets(documentName, 'OpenIDConnect')).toBeUndefined()
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

  it('matches security requirement when id key order differs from stored requirement', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument(),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ b: [], a: [] }] },
    )

    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['a', 'b'],
      name: 'a',
      scopes: ['scope-a'],
      meta: { type: 'document' },
    })

    const scheme = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(scheme)
    expect(scheme.selectedSchemes[0]).toEqual({ b: [], a: ['scope-a'] })
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

  it('updates scopes when using preferredSecurityScheme without stored selection', async () => {
    const documentName = 'test'
    const document = createDocument({
      components: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/authorize',
                tokenUrl: 'https://example.com/token',
                refreshUrl: 'https://example.com/refresh',
                scopes: {
                  'read:data': 'Read data',
                  'write:data': 'Write data',
                },
                'x-usePkce': 'no',
                'x-scalar-credentials-location': 'header',
              },
            },
          },
        },
      },
      security: [{ oauth2: [] }],
    })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document,
    })

    // No selected security stored - this simulates preferredSecurityScheme behavior
    // where selection is computed on-the-fly in getSelectedSecurity
    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toBeUndefined()

    // Try to update scopes (this should fail in the buggy version)
    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['oauth2'],
      name: 'oauth2',
      scopes: ['read:data'],
      meta: { type: 'document' },
    })

    // The scopes should now be updated and the selection should be persisted
    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes, 'Selection should be initialized when updating scopes')
    expect(schemes.selectedSchemes[0]).toEqual({ oauth2: ['read:data'] })
  })

  it('does not mutate document.security when fallback selection is used', async () => {
    const documentName = 'test'
    const document = createDocument({
      security: [{ oauth2: [] }],
    })
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document,
    })

    // No selected security stored, so updateSelectedScopes falls back to getSelectedSecurity.
    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['oauth2'],
      name: 'oauth2',
      scopes: ['read:data'],
      meta: { type: 'document' },
    })

    expect(getActiveOpenApiDocument(store)?.security).toEqual([{ oauth2: [] }])

    const selected = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(selected)
    expect(selected.selectedSchemes[0]).toEqual({ oauth2: ['read:data'] })
  })

  it('writes the fallback selection at the operation level when meta is operation', async () => {
    const documentName = 'test'
    const document = createDocument({
      components: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/authorize',
                tokenUrl: 'https://example.com/token',
                refreshUrl: 'https://example.com/refresh',
                scopes: {
                  'read:data': 'Read data',
                  'write:data': 'Write data',
                },
                'x-usePkce': 'no',
                'x-scalar-credentials-location': 'header',
              },
            },
          },
        },
      },
      paths: {
        '/pets': {
          get: {},
        },
      },
    })

    const store = createWorkspaceStore()
    await store.addDocument({ name: documentName, document })

    // No selection stored for either target.
    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toBeUndefined()
    expect(
      store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/pets', method: 'get' }),
    ).toBeUndefined()

    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['oauth2'],
      name: 'oauth2',
      scopes: ['read:data'],
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    // The fallback selection is persisted at the operation level (not the document level).
    const opSelection = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: '/pets',
      method: 'get',
    })
    assert(opSelection, 'Operation-level selection should be initialized by the fallback')
    expect(opSelection.selectedSchemes[0]).toEqual({ oauth2: ['read:data'] })
    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toBeUndefined()
  })

  it('builds a multi-scheme fallback requirement when id has multiple keys and nothing is stored', async () => {
    const documentName = 'test'
    const document = createDocument({
      components: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/authorize',
                tokenUrl: 'https://example.com/token',
                refreshUrl: 'https://example.com/refresh',
                scopes: { 'read:data': 'Read data' },
                'x-usePkce': 'no',
                'x-scalar-credentials-location': 'header',
              },
            },
          },
          apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
    })

    const store = createWorkspaceStore()
    await store.addDocument({ name: documentName, document })

    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName })).toBeUndefined()

    // `id` has two entries — exercises the `id.length === 1 ? id[0] : id` array branch when
    // deriving the preferred scheme for the fallback.
    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['oauth2', 'apiKey'],
      name: 'oauth2',
      scopes: ['read:data'],
      meta: { type: 'document' },
    })

    const selected = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(selected, 'Selection should be initialized from a multi-scheme fallback requirement')
    expect(selected.selectedSchemes[0]).toEqual({ oauth2: ['read:data'], apiKey: [] })
  })

  it('uses the stored selection without consulting document security when a target already exists', async () => {
    // Pins the laziness guarantee: when the store has a selection, the fallback (which would
    // otherwise have to consult `document.components`) must not run. We prove this indirectly
    // by leaving the document completely empty of any security context — the stored selection
    // is used directly and the update succeeds.
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      // No `security`, no `components`, no `paths` — the fallback would yield nothing usable.
      document: createDocument(),
    })

    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: [] }] },
    )

    updateSelectedScopes(store, store.workspace.activeDocument!, {
      id: ['OAuth'],
      name: 'OAuth',
      scopes: ['read'],
      meta: { type: 'document' },
    })

    const selected = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(selected)
    expect(selected.selectedSchemes[0]).toEqual({ OAuth: ['read'] })
    // selectedIndex from the stored target is preserved (the fallback would have recomputed it).
    expect(selected.selectedIndex).toBe(0)
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

    const activeDocument = getActiveOpenApiDocument(store)
    const components = activeDocument?.components
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
    expect(activeDocument?.security).toEqual([{ D: [] }])

    // Operation level filtering
    const op = getResolvedRef(activeDocument?.paths!['/p']?.get)
    assert(op)
    expect(op.security).toEqual([{ E: [] }])
    const opSchemes = store.auth.getAuthSelectedSchemas({ type: 'operation', documentName, path: '/p', method: 'get' })
    assert(opSchemes)
    expect(opSchemes.selectedSchemes).toEqual([{ F: [] }])
  })

  it('clamps document selectedIndex after selectedSchemes are cleaned up', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            A: { type: 'http', scheme: 'bearer' },
            B: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
            C: { type: 'http', scheme: 'basic' },
          },
        },
      }),
    })

    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 10, selectedSchemes: [{ A: [] }, { B: [] }, { C: [] }] },
    )

    deleteSecurityScheme(store, store.workspace.activeDocument!, { names: ['A', 'B'] })

    const docSchemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(docSchemes)
    expect(docSchemes.selectedSchemes).toEqual([{ C: [] }])
    expect(docSchemes.selectedIndex).toBe(0)
  })

  it('clamps selectedIndex to 0 when cleanup removes all schemes', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            A: { type: 'http', scheme: 'bearer' },
          },
        },
        paths: {
          '/p': { get: {} },
        },
      }),
    })

    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 2, selectedSchemes: [{ A: [] }] },
    )
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/p', method: 'get' },
      { selectedIndex: 3, selectedSchemes: [{ A: [] }] },
    )

    deleteSecurityScheme(store, store.workspace.activeDocument!, { names: ['A'] })

    const docSchemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(docSchemes)
    expect(docSchemes.selectedSchemes).toEqual([])
    expect(docSchemes.selectedIndex).toBe(0)

    const opSchemes = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: '/p',
      method: 'get',
    })
    assert(opSchemes)
    expect(opSchemes.selectedSchemes).toEqual([])
    expect(opSchemes.selectedIndex).toBe(0)
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

describe('upsertScope', () => {
  const buildOAuthDocument = (scopes: Record<string, string>) =>
    createDocument({
      components: {
        securitySchemes: {
          OAuth: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/auth',
                tokenUrl: 'https://example.com/token',
                refreshUrl: '',
                'x-usePkce': 'no',
                scopes,
              },
            },
          },
        },
      },
    })

  const getScopes = (store: ReturnType<typeof createWorkspaceStore>) =>
    (getResolvedRef(getActiveOpenApiDocument(store)?.components?.securitySchemes?.OAuth) as OAuth2Object).flows
      ?.authorizationCode?.scopes

  it('adds a new scope when oldScope is omitted', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'test', document: buildOAuthDocument({ 'read:items': 'Read access' }) })

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'write:items',
      description: 'Write access',
    })

    expect(getScopes(store)).toEqual({ 'read:items': 'Read access', 'write:items': 'Write access' })
  })

  it('renames an existing scope and updates the description when oldScope differs', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: buildOAuthDocument({ 'read:items': 'Read access', 'write:items': 'Write access' }),
    })

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:stuff',
      description: 'Read everything',
      oldScope: 'read:items',
    })

    expect(getScopes(store)).toEqual({ 'write:items': 'Write access', 'read:stuff': 'Read everything' })
  })

  it('updates only the description when oldScope equals the new scope', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'test', document: buildOAuthDocument({ 'read:items': 'Old description' }) })

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
      description: 'New description',
      oldScope: 'read:items',
    })

    expect(getScopes(store)).toEqual({ 'read:items': 'New description' })
  })

  it('is a no-op when oldScope is provided but the scope does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'test', document: buildOAuthDocument({ 'read:items': 'Read access' }) })

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'rename',
      description: 'desc',
      oldScope: 'does-not-exist',
    })

    expect(getScopes(store)).toEqual({ 'read:items': 'Read access' })
  })

  it('renames the scope inside document-level selection state', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: buildOAuthDocument({ 'read:items': 'Read access', 'write:items': 'Write access' }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items', 'write:items'] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:stuff',
      description: 'Read everything',
      oldScope: 'read:items',
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['read:stuff', 'write:items'] })
  })

  it('renames the scope inside operation-level selection state', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access' },
                },
              },
            },
          },
        },
        paths: {
          '/pets': { get: {} },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items'] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:stuff',
      description: 'Read everything',
      oldScope: 'read:items',
    })

    const opSchemes = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: '/pets',
      method: 'get',
    })
    assert(opSchemes)
    expect(opSchemes.selectedSchemes[0]).toEqual({ OAuth: ['read:stuff'] })
  })

  it('only rewrites selections that reference the matching scheme name', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access' },
                },
              },
            },
            OtherOAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  // Same scope name on an unrelated scheme — must not be renamed
                  scopes: { 'read:items': 'Different scope' },
                },
              },
            },
          },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items'] }, { OtherOAuth: ['read:items'] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:stuff',
      description: 'Read everything',
      oldScope: 'read:items',
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes).toEqual([{ OAuth: ['read:stuff'] }, { OtherOAuth: ['read:items'] }])
  })

  it('does not touch selection state when oldScope is omitted or equals scope', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: buildOAuthDocument({ 'read:items': 'Old description' }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items'] }] },
    )

    // Description-only update
    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
      description: 'New description',
      oldScope: 'read:items',
    })

    // Add-new
    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'write:items',
      description: 'Write access',
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['read:items'] })
  })

  it('is a no-op when the document is null or the security scheme is not OAuth', async () => {
    upsertScope(null, null, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'x',
      description: 'y',
    })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        components: {
          securitySchemes: {
            Basic: { type: 'http', scheme: 'basic' },
          },
        },
      }),
    })

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'Basic',
      flowType: 'authorizationCode',
      scope: 'x',
      description: 'y',
    })

    const basic = getResolvedRef(getActiveOpenApiDocument(store)?.components?.securitySchemes?.Basic)
    expect(basic).toEqual({ type: 'http', scheme: 'basic' })
  })

  it('appends the new scope to matching document-level selections when enable is true', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: buildOAuthDocument({ 'read:items': 'Read access' }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items'] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'write:items',
      description: 'Write access',
      enable: true,
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['read:items', 'write:items'] })
    expect(getScopes(store)).toEqual({ 'read:items': 'Read access', 'write:items': 'Write access' })
  })

  it('appends the new scope to matching operation-level selections when enable is true', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access' },
                },
              },
            },
          },
        },
        paths: {
          '/pets': { get: {} },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: [] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'write:items',
      description: 'Write access',
      enable: true,
    })

    const opSchemes = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: '/pets',
      method: 'get',
    })
    assert(opSchemes)
    expect(opSchemes.selectedSchemes[0]).toEqual({ OAuth: ['write:items'] })
  })

  it('does not duplicate the scope when enable is true and the scope is already selected', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: buildOAuthDocument({ 'read:items': 'Read access' }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items'] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
      description: 'Updated description',
      oldScope: 'read:items',
      enable: true,
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['read:items'] })
  })

  it('does not add the scope to selections that reference unrelated schemes when enable is true', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access' },
                },
              },
            },
            OtherOAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access' },
                },
              },
            },
          },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: [] }, { OtherOAuth: [] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'write:items',
      description: 'Write access',
      enable: true,
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes).toEqual([{ OAuth: ['write:items'] }, { OtherOAuth: [] }])
  })

  it('combines rename and enable when both are provided', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: buildOAuthDocument({ 'read:items': 'Read access' }),
    })
    // The requirement is selected but the renamed scope is not currently present.
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: [] }] },
    )

    upsertScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:stuff',
      description: 'Read everything',
      oldScope: 'read:items',
      enable: true,
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['read:stuff'] })
    expect(getScopes(store)).toEqual({ 'read:stuff': 'Read everything' })
  })
})

describe('deleteScope', () => {
  it('removes a scope from the targeted flow', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access', 'write:items': 'Write access' },
                },
              },
            },
          },
        },
      }),
    })

    deleteScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
    })

    const flow = (getResolvedRef(getActiveOpenApiDocument(store)?.components?.securitySchemes?.OAuth) as OAuth2Object)
      .flows?.authorizationCode
    expect(flow?.scopes).toEqual({ 'write:items': 'Write access' })
  })

  it('strips the deleted scope from document-level selection state', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access', 'write:items': 'Write access' },
                },
              },
            },
          },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items', 'write:items'] }] },
    )

    deleteScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes[0]).toEqual({ OAuth: ['write:items'] })
  })

  it('strips the deleted scope from operation-level selection state', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access', 'write:items': 'Write access' },
                },
              },
            },
          },
        },
        paths: {
          '/pets': { get: {} },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName, path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ OAuth: ['read:items', 'write:items'] }] },
    )

    deleteScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
    })

    const opSchemes = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: '/pets',
      method: 'get',
    })
    assert(opSchemes)
    expect(opSchemes.selectedSchemes[0]).toEqual({ OAuth: ['write:items'] })
  })

  it('only cleans up selection entries that reference the matching scheme name', async () => {
    const documentName = 'test'
    const store = createWorkspaceStore()
    await store.addDocument({
      name: documentName,
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: { 'read:items': 'Read access' },
                },
              },
            },
            OtherOAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  // Same scope name on an unrelated scheme — must not be touched
                  scopes: { 'read:items': 'Different scope' },
                },
              },
            },
          },
        },
      }),
    })
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName },
      {
        selectedIndex: 0,
        selectedSchemes: [{ OAuth: ['read:items'] }, { OtherOAuth: ['read:items'] }],
      },
    )

    deleteScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'read:items',
    })

    const schemes = store.auth.getAuthSelectedSchemas({ type: 'document', documentName })
    assert(schemes)
    expect(schemes.selectedSchemes).toEqual([{ OAuth: [] }, { OtherOAuth: ['read:items'] }])
  })

  it('is a no-op when the document is null or the flow has no scopes', async () => {
    deleteScope(null, null, { name: 'OAuth', flowType: 'authorizationCode', scope: 'x' })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/auth',
                  tokenUrl: 'https://example.com/token',
                  refreshUrl: '',
                  'x-usePkce': 'no',
                  scopes: {},
                },
              },
            },
          },
        },
      }),
    })

    deleteScope(store, getActiveOpenApiDocument(store)!, {
      name: 'OAuth',
      flowType: 'authorizationCode',
      scope: 'missing',
    })

    const flow = (getResolvedRef(getActiveOpenApiDocument(store)?.components?.securitySchemes?.OAuth) as OAuth2Object)
      .flows?.authorizationCode
    expect(flow?.scopes).toEqual({})
  })
})
