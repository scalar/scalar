import { assert, describe, expect, it } from 'vitest'

import {
  deleteSecurityScheme,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
} from '@/mutators/auth'
import type { WorkspaceDocument } from '@/schemas'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'

function createDocument(initial?: Partial<WorkspaceDocument>): WorkspaceDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
  }
}

describe('updateSelectedSecuritySchemes', () => {
  it('initializes document x-scalar-selected-security and sets selected index to 0 when schemes exist', () => {
    const document = createDocument()

    const selected: SecurityRequirementObject[] = [{ bearerAuth: [] }]

    updateSelectedSecuritySchemes({
      document,
      selectedSecuritySchemes: selected,
      create: [],
      meta: { type: 'document' },
    })

    expect(document['x-scalar-selected-security']).toBeDefined()
    expect(document['x-scalar-selected-security']!['x-schemes']).toEqual(selected)
    expect(document['x-scalar-selected-security']!['x-selected-index']).toBe(0)
  })

  it('appends newly created schemes with unique names and updates selection', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key', 'x-scalar-secret-token': '' },
        },
      },
    })

    const createItems: { name: string; scheme: SecuritySchemeObject }[] = [
      { name: 'ApiKeyAuth', scheme: { type: 'apiKey', in: 'query', name: 'api_key', 'x-scalar-secret-token': '' } },
    ]

    updateSelectedSecuritySchemes({
      document,
      selectedSecuritySchemes: [],
      create: createItems,
      meta: { type: 'document' },
    })

    // A unique name should be generated because ApiKeyAuth already exists
    const names = Object.keys(document.components!.securitySchemes!)
    expect(names).toContain('ApiKeyAuth')
    expect(names).toContain('ApiKeyAuth 1')

    // Selection should include the newly created scheme with empty scopes
    const schemes = document['x-scalar-selected-security']!['x-schemes']
    expect(schemes).toHaveLength(1)
    assert(schemes[0])
    expect(Object.keys(schemes[0])).toEqual(['ApiKeyAuth 1'])
    expect(Object.values(schemes[0])[0]).toEqual([])

    // Index is initialized to 0 when adding first item
    expect(document['x-scalar-selected-security']!['x-selected-index']).toBe(0)
  })

  it('preserves a valid selected index', () => {
    const document = createDocument({
      'x-scalar-selected-security': {
        'x-selected-index': 1,
        'x-schemes': [{ s1: [] }, { s2: [] }],
      },
    })

    updateSelectedSecuritySchemes({
      document,
      selectedSecuritySchemes: [{ s1: [] }, { s2: [] }],
      create: [],
      meta: { type: 'document' },
    })

    expect(document['x-scalar-selected-security']!['x-selected-index']).toBe(1)
    expect(document['x-scalar-selected-security']!['x-schemes']).toEqual([{ s1: [] }, { s2: [] }])
  })

  it('corrects an out-of-bounds selected index to the last available scheme', () => {
    const document = createDocument({
      'x-scalar-selected-security': {
        'x-selected-index': 5,
        'x-schemes': [{ only: [] }],
      },
    })

    const nextSelected: SecurityRequirementObject[] = [{ a: [] }, { b: [] }]

    updateSelectedSecuritySchemes({
      document,
      selectedSecuritySchemes: nextSelected,
      create: [],
      meta: { type: 'document' },
    })

    expect(document['x-scalar-selected-security']!['x-schemes']).toEqual(nextSelected)
    expect(document['x-scalar-selected-security']!['x-selected-index']).toBe(nextSelected.length - 1)
  })

  it('updates operation-level selection and updates components for created schemes', () => {
    const document = createDocument({ paths: { '/pets': { get: {} as unknown as Record<string, unknown> } } })

    updateSelectedSecuritySchemes({
      document,
      selectedSecuritySchemes: [{ bearerAuth: [] }],
      create: [
        {
          name: 'BearerAuth',
          scheme: {
            type: 'http',
            scheme: 'bearer',
            'x-scalar-secret-password': '',
            'x-scalar-secret-token': '',
            'x-scalar-secret-username': '',
          },
        },
      ],
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    // Components should include the newly created scheme
    expect(document.components?.securitySchemes?.['BearerAuth']).toEqual({
      type: 'http',
      scheme: 'bearer',
      'x-scalar-secret-password': '',
      'x-scalar-secret-token': '',
      'x-scalar-secret-username': '',
    })

    // Operation-level selection should be created and set
    const operation = (document.paths!['/pets'] as Record<string, any>).get
    const ext = operation['x-scalar-selected-security']
    expect(ext).toBeDefined()
    expect(ext['x-schemes']).toEqual([{ bearerAuth: [] }, { BearerAuth: [] }])
    expect(ext['x-selected-index']).toBe(0)
  })
})

describe('updateSecurityScheme', () => {
  it('updates http scheme secrets (username, password, token)', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          HttpAuth: {
            type: 'http',
            scheme: 'basic',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-token': '',
          },
        },
      },
    })

    updateSecurityScheme({
      document,
      name: 'HttpAuth',
      data: {
        type: 'http',
        payload: { username: 'u', password: 'p', token: 't' },
      },
    })

    const scheme = document.components!.securitySchemes!.HttpAuth as Record<string, unknown>
    expect(scheme['x-scalar-secret-username']).toBe('u')
    expect(scheme['x-scalar-secret-password']).toBe('p')
    expect(scheme['x-scalar-secret-token']).toBe('t')
  })

  it('updates apiKey scheme name and secret token', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key', 'x-scalar-secret-token': '' },
        },
      },
    })

    updateSecurityScheme({
      document,
      name: 'ApiKey',
      data: {
        type: 'apiKey',
        payload: { name: 'X-NEW-KEY', value: 'secret' },
      },
    })

    const scheme = document.components!.securitySchemes!.ApiKey as Record<string, unknown>
    expect(scheme['name']).toBe('X-NEW-KEY')
    expect(scheme['x-scalar-secret-token']).toBe('secret')
  })

  it('updates oauth2 authorizationCode flow fields and secrets', () => {
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
                // The implementation only updates fields that already exist on the flow
                token: '',
                redirectUrl: '',
                clientId: '',
                'x-scalar-secret-client-secret': '',
                usePkce: 'no',
                username: '',
                password: '',
              },
            },
          } as unknown as SecuritySchemeObject,
        },
      },
    })

    updateSecurityScheme({
      document,
      name: 'OAuth',
      data: {
        type: 'oauth2',
        flow: 'authorizationCode',
        payload: {
          authUrl: 'https://auth',
          tokenUrl: 'https://token',
          token: 'tok',
          redirectUrl: 'https://cb',
          clientId: 'cid',
          clientSecret: 'csecret',
          usePkce: 'SHA-256',
          username: 'user',
          password: 'pass',
        },
      },
    })

    const flow = (document.components!.securitySchemes!.OAuth as any).flows.authorizationCode
    expect(flow.authorizationUrl).toBe('https://auth')
    expect(flow.tokenUrl).toBe('https://token')
    expect(flow.token).toBe('tok')
    expect(flow.redirectUrl).toBe('https://cb')
    expect(flow['x-scalar-secret-client-id']).toBe('cid')
    expect(flow['x-scalar-secret-client-secret']).toBe('csecret')
    expect(flow.usePkce).toBe('SHA-256')
    expect(flow.username).toBe('user')
    expect(flow.password).toBe('pass')
  })

  it('is a no-op when document is null or scheme missing', () => {
    // null document
    updateSecurityScheme({ document: null, name: 'X', data: { type: 'http', payload: {} } })

    // missing scheme
    const document = createDocument({ components: { securitySchemes: {} } })
    updateSecurityScheme({ document, name: 'NotDefined', data: { type: 'http', payload: {} } })

    // Nothing to assert beyond no throw and document untouched
    expect(document.components!.securitySchemes).toEqual({})
  })
})

describe('updateSelectedAuthTab', () => {
  it('initializes document extension when missing and sets selected index', () => {
    const document = createDocument()

    updateSelectedAuthTab({
      document,
      index: 3,
      meta: { type: 'document' },
    })

    const ext = document['x-scalar-selected-security']
    expect(ext).toBeDefined()
    expect(ext!['x-selected-index']).toBe(3)
    expect(ext!['x-schemes']).toEqual([])
  })

  it('updates only the selected index and preserves existing schemes', () => {
    const document = createDocument({
      'x-scalar-selected-security': {
        'x-selected-index': 0,
        'x-schemes': [{ s1: [] }],
      },
    })

    updateSelectedAuthTab({
      document,
      index: 5,
      meta: { type: 'document' },
    })

    const ext = document['x-scalar-selected-security']!
    expect(ext['x-selected-index']).toBe(5)
    expect(ext['x-schemes']).toEqual([{ s1: [] }])
  })

  it('sets selected index for an operation target', () => {
    const document = createDocument({ paths: { '/pets': { get: {} as unknown as Record<string, unknown> } } })

    updateSelectedAuthTab({
      document,
      index: 2,
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    const operation = (document.paths!['/pets'] as Record<string, any>).get
    const ext = operation['x-scalar-selected-security']
    expect(ext).toBeDefined()
    expect(ext['x-selected-index']).toBe(2)
    expect(ext['x-schemes']).toEqual([])
  })

  it('is a no-op when document is null', () => {
    updateSelectedAuthTab({ document: null, index: 1, meta: { type: 'document' } })
  })

  it('is a no-op when operation target cannot be resolved', () => {
    const document = createDocument({ paths: {} })

    updateSelectedAuthTab({
      document,
      index: 1,
      meta: { type: 'operation', path: '/missing', method: 'get' },
    })

    // Root extension should remain undefined since only operation should be targeted
    expect(document['x-scalar-selected-security']).toBeUndefined()
  })
})

describe('updateSelectedScopes', () => {
  it('updates scopes for the matching scheme at document level', () => {
    const document = createDocument({
      'x-scalar-selected-security': {
        'x-selected-index': 0,
        'x-schemes': [{ OAuth: [] }],
      },
    })

    updateSelectedScopes({
      document,
      id: ['OAuth'],
      name: 'OAuth',
      scopes: ['read', 'write'],
      meta: { type: 'document' },
    })

    const schemes = document['x-scalar-selected-security']!['x-schemes']
    expect(schemes[0]?.OAuth).toEqual(['read', 'write'])
  })

  it('updates scopes for matching scheme at operation level', () => {
    const document = createDocument({
      'x-scalar-selected-security': {
        'x-selected-index': 0,
        'x-schemes': [{ DocScheme: [] }],
      },
      paths: {
        '/pets': {
          get: { 'x-scalar-selected-security': { 'x-selected-index': 0, 'x-schemes': [{ OpOAuth: ['old'] }] } } as any,
        },
      },
    })

    updateSelectedScopes({
      document,
      id: ['OpOAuth'],
      name: 'OpOAuth',
      scopes: ['new'],
      meta: { type: 'operation', path: '/pets', method: 'get' },
    })

    const op = (document.paths!['/pets'] as any).get
    expect(op['x-scalar-selected-security']['x-schemes'][0].OpOAuth).toEqual(['new'])
    assert(document['x-scalar-selected-security'])
    // Document level should remain unchanged
    const docSchemes = document['x-scalar-selected-security']['x-schemes']
    assert(docSchemes[0])
    expect(docSchemes[0].DocScheme).toEqual([])
  })

  it('matches by id array of keys (multi-scheme requirement) and updates only the named entry', () => {
    const document = createDocument({
      'x-scalar-selected-security': {
        'x-selected-index': 0,
        'x-schemes': [{ a: [], b: [] }, { a: [] }, { b: [] }],
      },
    })

    updateSelectedScopes({
      document,
      id: ['a', 'b'],
      name: 'a',
      scopes: ['one'],
      meta: { type: 'document' },
    })

    const scheme = document['x-scalar-selected-security']!['x-schemes'][0]
    assert(scheme)
    expect(scheme.a).toEqual(['one'])
    expect(scheme.b).toEqual([])
  })

  it('is a no-op when document is null', () => {
    updateSelectedScopes({ document: null, id: ['x'], name: 'x', scopes: [], meta: { type: 'document' } })
  })

  it('is a no-op when selected schemes are missing or scheme id not found', () => {
    const document = createDocument()

    // No selected extension yet
    updateSelectedScopes({ document, id: ['missing'], name: 'missing', scopes: ['s'], meta: { type: 'document' } })
    expect(document['x-scalar-selected-security']).toBeUndefined()

    // With extension but id does not match
    document['x-scalar-selected-security'] = { 'x-selected-index': 0, 'x-schemes': [{ z: [] }] }
    updateSelectedScopes({ document, id: ['notZ'], name: 'notZ', scopes: ['s'], meta: { type: 'document' } })
    const zSchemes = document['x-scalar-selected-security']!['x-schemes']
    assert(zSchemes[0])
    expect(zSchemes[0].z).toEqual([])
  })
})

describe('deleteSecurityScheme', () => {
  it('removes schemes from components, document selections, document security, and operations', () => {
    const document = createDocument({
      components: {
        securitySchemes: {
          A: {
            type: 'http',
            scheme: 'bearer',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-token': '',
          },
          B: { type: 'apiKey', in: 'header', name: 'X-API-Key', 'x-scalar-secret-token': '' },
          C: {
            type: 'http',
            scheme: 'basic',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-token': '',
          },
        },
      },
      'x-scalar-selected-security': {
        'x-selected-index': 0,
        'x-schemes': [{ A: [] }, { B: [] }, { C: [] }],
      },
      security: [{ A: [] }, { D: [] }],
      paths: {
        '/p': {
          get: {
            security: [{ A: [] }, { E: [] }],
            'x-scalar-selected-security': { 'x-selected-index': 0, 'x-schemes': [{ B: [] }, { F: [] }] },
          } as any,
        },
      },
    })

    deleteSecurityScheme({ document, names: ['A', 'B', 'X'] })

    // Components
    assert(document.components)
    assert(document.components.securitySchemes)
    expect(document.components.securitySchemes.A).toBeUndefined()
    expect(document.components.securitySchemes.B).toBeUndefined()
    expect(document.components.securitySchemes.C).toBeDefined()

    // Document extension selections
    assert(document['x-scalar-selected-security'])
    const docSchemes = document['x-scalar-selected-security']['x-schemes']
    expect(docSchemes).toEqual([{ C: [] }])

    // Document security array
    expect(document.security).toEqual([{ D: [] }])

    // Operation level filtering
    const op = (document.paths!['/p'] as any).get
    expect(op.security).toEqual([{ E: [] }])
    expect(op['x-scalar-selected-security']['x-schemes']).toEqual([{ F: [] }])
  })

  it('is a no-op when document is null or components are missing', () => {
    // null doc
    deleteSecurityScheme({ document: null, names: ['A'] })

    // missing components -> selected security should not be touched due to early return
    const document = createDocument({
      'x-scalar-selected-security': { 'x-selected-index': 0, 'x-schemes': [{ A: [] }, { B: [] }] },
    })
    deleteSecurityScheme({ document, names: ['A'] })

    assert(document['x-scalar-selected-security'])
    expect(document['x-scalar-selected-security']['x-schemes']).toEqual([{ A: [] }, { B: [] }])
  })
})
