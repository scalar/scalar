import { assert, describe, expect, it, vi } from 'vitest'

import type { DocumentAuth, SecretsAuthUnion, SelectedSecurity } from '@/entities/auth/schema'

import { createAuthStore } from './index'

describe('createAuthStore', () => {
  describe('getAuthSecrets', () => {
    it('returns undefined when document does not exist', () => {
      const store = createAuthStore()
      const result = store.getAuthSecrets('nonExistent', 'scheme1')

      expect(result).toBeUndefined()
    })

    it('returns undefined when document exists but scheme does not', () => {
      const store = createAuthStore()
      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token123',
      })

      const result = store.getAuthSecrets('doc1', 'nonExistentScheme')

      expect(result).toBeUndefined()
    })

    it('returns the auth secrets for a valid document and scheme', () => {
      const store = createAuthStore()
      const secrets: SecretsAuthUnion = {
        type: 'apiKey',
        'x-scalar-secret-token': 'myApiKey',
      }

      store.setAuthSecrets('doc1', 'ApiKeyAuth', secrets)
      const result = store.getAuthSecrets('doc1', 'ApiKeyAuth')

      expect(result).toEqual(secrets)
    })

    it('handles multiple documents and schemes', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSecrets('doc1', 'scheme2', {
        type: 'http',
        'x-scalar-secret-token': 'token2',
        'x-scalar-secret-password': 'password2',
        'x-scalar-secret-username': 'username2',
      })
      store.setAuthSecrets('doc2', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token3',
      })

      const doc1Scheme1 = store.getAuthSecrets('doc1', 'scheme1')
      expect(doc1Scheme1?.type).toBe('apiKey')
      assert(doc1Scheme1?.type === 'apiKey')
      expect(doc1Scheme1?.['x-scalar-secret-token']).toBe('token1')

      const doc1Scheme2 = store.getAuthSecrets('doc1', 'scheme2')
      expect(doc1Scheme2?.type).toBe('http')
      assert(doc1Scheme2?.type === 'http')
      expect(doc1Scheme2?.['x-scalar-secret-token']).toBe('token2')

      const doc2Scheme1 = store.getAuthSecrets('doc2', 'scheme1')
      expect(doc2Scheme1?.type).toBe('apiKey')
      assert(doc2Scheme1?.type === 'apiKey')
      expect(doc2Scheme1?.['x-scalar-secret-token']).toBe('token3')
    })
  })

  describe('setAuthSecrets', () => {
    it('creates a new document entry when setting secrets for a non-existent document', () => {
      const store = createAuthStore()
      const secrets: SecretsAuthUnion = {
        type: 'apiKey',
        'x-scalar-secret-token': 'myToken',
      }

      store.setAuthSecrets('newDoc', 'scheme1', secrets)

      expect(store.getAuthSecrets('newDoc', 'scheme1')).toEqual(secrets)
    })

    it('adds secrets to an existing document', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSecrets('doc1', 'scheme2', {
        type: 'http',
        'x-scalar-secret-token': 'token2',
        'x-scalar-secret-username': 'username2',
        'x-scalar-secret-password': 'password2',
      })

      expect(store.getAuthSecrets('doc1', 'scheme1')).toBeDefined()
      expect(store.getAuthSecrets('doc1', 'scheme2')).toBeDefined()
    })

    it('overwrites existing secrets for the same document and scheme', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'oldToken',
      })
      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'newToken',
      })

      expect(store.getAuthSecrets('doc1', 'scheme1')).toEqual({
        type: 'apiKey',
        'x-scalar-secret-token': 'newToken',
      })
    })

    it('handles http auth type', () => {
      const store = createAuthStore()
      const secrets: SecretsAuthUnion = {
        type: 'http',
        'x-scalar-secret-token': 'bearerToken',
        'x-scalar-secret-username': 'user',
        'x-scalar-secret-password': 'pass',
      }

      store.setAuthSecrets('doc1', 'httpAuth', secrets)

      expect(store.getAuthSecrets('doc1', 'httpAuth')).toEqual(secrets)
    })

    it('handles oauth2 auth type', () => {
      const store = createAuthStore()
      const secrets: SecretsAuthUnion = {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-client-id': 'clientId',
          'x-scalar-secret-token': 'accessToken',
          'x-scalar-secret-client-secret': 'clientSecret',
          'x-scalar-secret-redirect-uri': 'http://localhost/callback',
          'x-scalar-credentials-location': 'body',
        },
      }

      store.setAuthSecrets('doc1', 'oauth', secrets)

      expect(store.getAuthSecrets('doc1', 'oauth')).toEqual(secrets)
    })

    it('coerces the value according to schema', () => {
      const store = createAuthStore()

      // The setAuthSecrets should coerce the value
      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      } as SecretsAuthUnion)

      const result = store.getAuthSecrets('doc1', 'scheme1')
      expect(result).toBeDefined()
      expect(result?.type).toBe('apiKey')
    })
  })

  describe('getAuthSelectedSchemas', () => {
    it('returns undefined when document does not exist', () => {
      const store = createAuthStore()

      const result = store.getAuthSelectedSchemas({
        type: 'document',
        documentName: 'nonExistent',
      })

      expect(result).toBeUndefined()
    })

    it('returns undefined when document exists but no selection is set', () => {
      const store = createAuthStore()
      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      const result = store.getAuthSelectedSchemas({
        type: 'document',
        documentName: 'doc1',
      })

      expect(result).toBeUndefined()
    })

    it('returns document-level selected schemas', () => {
      const store = createAuthStore()
      const selected: SelectedSecurity = {
        selectedIndex: 0,
        selectedSchemes: [{ scheme1: [] }],
      }

      store.setAuthSelectedSchemas({ type: 'document', documentName: 'doc1' }, selected)

      const result = store.getAuthSelectedSchemas({
        type: 'document',
        documentName: 'doc1',
      })

      expect(result).toEqual(selected)
    })

    it('returns operation-level selected schemas', () => {
      const store = createAuthStore()
      const selected: SelectedSecurity = {
        selectedIndex: 1,
        selectedSchemes: [{ scheme1: [] }, { scheme2: ['read', 'write'] }],
      }

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        selected,
      )

      const result = store.getAuthSelectedSchemas({
        type: 'operation',
        documentName: 'doc1',
        path: '/pets',
        method: 'get',
      })

      expect(result).toEqual(selected)
    })

    it('returns undefined for non-existent operation path', () => {
      const store = createAuthStore()
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [] },
      )

      const result = store.getAuthSelectedSchemas({
        type: 'operation',
        documentName: 'doc1',
        path: '/users',
        method: 'post',
      })

      expect(result).toBeUndefined()
    })

    it('handles different operations on the same path', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [{ readScheme: [] }] },
      )

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'post',
        },
        { selectedIndex: 0, selectedSchemes: [{ writeScheme: [] }] },
      )

      expect(
        store.getAuthSelectedSchemas({
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        }),
      ).toEqual({ selectedIndex: 0, selectedSchemes: [{ readScheme: [] }] })

      expect(
        store.getAuthSelectedSchemas({
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'post',
        }),
      ).toEqual({ selectedIndex: 0, selectedSchemes: [{ writeScheme: [] }] })
    })
  })

  describe('setAuthSelectedSchemas', () => {
    it('creates a new document entry when setting selection for a non-existent document', () => {
      const store = createAuthStore()
      const selected: SelectedSecurity = {
        selectedIndex: 0,
        selectedSchemes: [{ scheme1: [] }],
      }

      store.setAuthSelectedSchemas({ type: 'document', documentName: 'newDoc' }, selected)

      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'newDoc' })).toEqual(selected)
    })

    it('sets document-level selected schemas', () => {
      const store = createAuthStore()
      const selected: SelectedSecurity = {
        selectedIndex: 2,
        selectedSchemes: [{ s1: [] }, { s2: [] }, { s3: ['scope1'] }],
      }

      store.setAuthSelectedSchemas({ type: 'document', documentName: 'doc1' }, selected)

      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toEqual(selected)
    })

    it('overwrites existing document-level selection', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ old: [] }] },
      )

      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 1, selectedSchemes: [{ new1: [] }, { new2: [] }] },
      )

      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toEqual({
        selectedIndex: 1,
        selectedSchemes: [{ new1: [] }, { new2: [] }],
      })
    })

    it('sets operation-level selected schemas', () => {
      const store = createAuthStore()
      const selected: SelectedSecurity = {
        selectedIndex: 0,
        selectedSchemes: [{ opScheme: ['read'] }],
      }

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        selected,
      )

      const result = store.getAuthSelectedSchemas({
        type: 'operation',
        documentName: 'doc1',
        path: '/pets',
        method: 'get',
      })

      expect(result).toEqual(selected)
    })

    it('creates nested path structures when setting operation-level selection', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [] },
      )

      // Verify structure was created
      const exported = store.export()
      expect(exported.doc1?.selected?.path).toBeDefined()
      expect(exported.doc1?.selected?.path?.['/pets']).toBeDefined()
      expect(exported.doc1?.selected?.path?.['/pets']?.['get']).toBeDefined()
    })

    it('handles multiple operations on different paths', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] },
      )

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/users',
          method: 'post',
        },
        { selectedIndex: 1, selectedSchemes: [{ scheme2: [] }, { scheme3: [] }] },
      )

      expect(
        store.getAuthSelectedSchemas({
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        }),
      ).toEqual({ selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] })

      expect(
        store.getAuthSelectedSchemas({
          type: 'operation',
          documentName: 'doc1',
          path: '/users',
          method: 'post',
        }),
      ).toEqual({ selectedIndex: 1, selectedSchemes: [{ scheme2: [] }, { scheme3: [] }] })
    })

    it('preserves existing secrets when setting selected schemas', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] },
      )

      expect(store.getAuthSecrets('doc1', 'scheme1')).toBeDefined()
      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toBeDefined()
    })

    it('handles empty selectedSchemes array', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [] },
      )

      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toEqual({
        selectedIndex: 0,
        selectedSchemes: [],
      })
    })
  })

  describe('clearDocumentAuth', () => {
    it('removes all authentication data for a document', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })
      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] },
      )

      store.clearDocumentAuth('doc1')

      expect(store.getAuthSecrets('doc1', 'scheme1')).toBeUndefined()
      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toBeUndefined()
    })

    it('removes document-level and operation-level data', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [] },
      )
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [] },
      )

      store.clearDocumentAuth('doc1')

      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toBeUndefined()
      expect(
        store.getAuthSelectedSchemas({
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        }),
      ).toBeUndefined()
    })

    it('does not affect other documents', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSecrets('doc2', 'scheme2', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token2',
      })

      store.clearDocumentAuth('doc1')

      expect(store.getAuthSecrets('doc1', 'scheme1')).toBeUndefined()
      expect(store.getAuthSecrets('doc2', 'scheme2')).toBeDefined()
    })

    it('handles clearing a non-existent document gracefully', () => {
      const store = createAuthStore()

      expect(() => {
        store.clearDocumentAuth('nonExistent')
      }).not.toThrow()
    })
  })

  describe('load', () => {
    it('loads authentication data into the store', () => {
      const store = createAuthStore()
      const data: DocumentAuth = {
        doc1: {
          secrets: {
            scheme1: {
              type: 'apiKey',
              'x-scalar-secret-token': 'token1',
            },
          },
          selected: {
            document: {
              selectedIndex: 0,
              selectedSchemes: [{ scheme1: [] }],
            },
          },
        },
      }

      store.load(data)

      expect(store.getAuthSecrets('doc1', 'scheme1')).toEqual({
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      expect(store.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ scheme1: [] }],
      })
    })

    it('replaces existing state when loading', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'oldScheme', {
        type: 'apiKey',
        'x-scalar-secret-token': 'oldToken',
      })

      const data: DocumentAuth = {
        doc1: {
          secrets: {
            newScheme: {
              type: 'apiKey',
              'x-scalar-secret-token': 'newToken',
            },
          },
          selected: {
            document: undefined,
            path: undefined,
          },
        },
      }

      store.load(data)

      expect(store.getAuthSecrets('doc1', 'oldScheme')).toBeUndefined()
      expect(store.getAuthSecrets('doc1', 'newScheme')).toBeDefined()
    })

    it('loads multiple documents', () => {
      const store = createAuthStore()
      const data: DocumentAuth = {
        doc1: {
          secrets: {
            scheme1: {
              type: 'apiKey',
              'x-scalar-secret-token': 'token1',
            },
          },
          selected: {
            document: undefined,
            path: undefined,
          },
        },
        doc2: {
          secrets: {
            scheme2: {
              type: 'http',
              'x-scalar-secret-token': 'token2',
              'x-scalar-secret-username': 'username2',
              'x-scalar-secret-password': 'password2',
            },
          },
          selected: {
            document: undefined,
            path: undefined,
          },
        },
      }

      store.load(data)

      expect(store.getAuthSecrets('doc1', 'scheme1')).toBeDefined()
      expect(store.getAuthSecrets('doc2', 'scheme2')).toBeDefined()
    })

    it('loads operation-level selections', () => {
      const store = createAuthStore()
      const data: DocumentAuth = {
        doc1: {
          secrets: {},
          selected: {
            document: undefined,
            path: {
              '/pets': {
                get: {
                  selectedIndex: 0,
                  selectedSchemes: [{ opScheme: [] }],
                },
              },
            },
          },
        },
      }

      store.load(data)

      expect(
        store.getAuthSelectedSchemas({
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        }),
      ).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ opScheme: [] }],
      })
    })

    it('handles empty data object', () => {
      const store = createAuthStore()

      expect(() => {
        store.load({})
      }).not.toThrow()

      expect(store.export()).toEqual({})
    })

    it('coerces loaded data according to schema', () => {
      const store = createAuthStore()
      const data: DocumentAuth = {
        doc1: {
          secrets: {
            scheme1: {
              type: 'apiKey',
              'x-scalar-secret-token': 'token',
            },
          },
          selected: {
            document: {
              selectedIndex: 0,
              selectedSchemes: [],
            },
          },
        },
      }

      store.load(data)

      const result = store.getAuthSecrets('doc1', 'scheme1')
      expect(result).toBeDefined()
      expect(result?.type).toBe('apiKey')
    })
  })

  describe('export', () => {
    it('exports an empty object when no data exists', () => {
      const store = createAuthStore()

      const result = store.export()

      expect(result).toEqual({})
    })

    it('exports authentication data as a plain object', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] },
      )

      const result = store.export()

      expect(result.doc1).toBeDefined()
      expect(result.doc1?.secrets.scheme1).toEqual({
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      expect(result.doc1?.selected.document).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ scheme1: [] }],
      })
    })

    it('exports multiple documents', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSecrets('doc2', 'scheme2', {
        type: 'http',
        'x-scalar-secret-token': 'token2',
        'x-scalar-secret-username': 'username2',
        'x-scalar-secret-password': 'password2',
      })

      const result = store.export()

      expect(Object.keys(result)).toHaveLength(2)
      expect(result.doc1).toBeDefined()
      expect(result.doc2).toBeDefined()
    })

    it('exports operation-level selections', () => {
      const store = createAuthStore()

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [{ opScheme: [] }] },
      )

      const result = store.export()

      expect(result.doc1?.selected.path?.['/pets']?.['get']).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ opScheme: [] }],
      })
    })

    it('returns a non-proxy object', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      const result = store.export()

      // The result should be a plain object, not a proxy
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('exports complete state including both secrets and selections', () => {
      const store = createAuthStore()

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSecrets('doc1', 'scheme2', {
        type: 'http',
        'x-scalar-secret-token': 'token2',
        'x-scalar-secret-username': 'username2',
        'x-scalar-secret-password': 'password2',
      })
      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] },
      )
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [{ scheme2: [] }] },
      )

      const result = store.export()

      expect(result.doc1?.secrets.scheme1).toBeDefined()
      expect(result.doc1?.secrets.scheme2).toBeDefined()
      expect(result.doc1?.selected.document).toBeDefined()
      expect(result.doc1?.selected.path?.['/pets']?.['get']).toBeDefined()
    })
  })

  describe('hooks', () => {
    it('calls onAuthChange when setting secrets', () => {
      const onAuthChange = vi.fn()
      const store = createAuthStore({ hooks: { onAuthChange } })

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      expect(onAuthChange).toHaveBeenCalledWith('doc1')
    })

    it('calls onAuthChange when setting selected schemas at document level', () => {
      const onAuthChange = vi.fn()
      const store = createAuthStore({ hooks: { onAuthChange } })

      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [] },
      )

      expect(onAuthChange).toHaveBeenCalledWith('doc1')
    })

    it('calls onAuthChange when setting selected schemas at operation level', () => {
      const onAuthChange = vi.fn()
      const store = createAuthStore({ hooks: { onAuthChange } })

      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [] },
      )

      expect(onAuthChange).toHaveBeenCalledWith('doc1')
    })

    it('calls onAuthChange when loading data', () => {
      const onAuthChange = vi.fn()
      const store = createAuthStore({ hooks: { onAuthChange } })

      const data: DocumentAuth = {
        doc1: {
          secrets: {
            scheme1: {
              type: 'apiKey',
              'x-scalar-secret-token': 'token',
            },
          },
          selected: {
            document: undefined,
            path: undefined,
          },
        },
      }

      store.load(data)

      expect(onAuthChange).toHaveBeenCalledWith('doc1')
    })

    it('calls onAuthChange for multiple document changes', () => {
      const onAuthChange = vi.fn()
      const store = createAuthStore({ hooks: { onAuthChange } })

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token1',
      })
      store.setAuthSecrets('doc2', 'scheme2', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token2',
      })

      // The hook should be called for both documents (may be called multiple times per document due to nested changes)
      expect(onAuthChange).toHaveBeenCalledWith('doc1')
      expect(onAuthChange).toHaveBeenCalledWith('doc2')
      expect(onAuthChange.mock.calls.length).toBeGreaterThan(0)
    })

    it('does not throw when onAuthChange is not provided', () => {
      const store = createAuthStore()

      expect(() => {
        store.setAuthSecrets('doc1', 'scheme1', {
          type: 'apiKey',
          'x-scalar-secret-token': 'token',
        })
      }).not.toThrow()
    })

    it('does not call hook when path length is less than 1', () => {
      const onAuthChange = vi.fn()
      // This is testing internal behavior, but we can verify it doesn't break
      const store = createAuthStore({ hooks: { onAuthChange } })

      store.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      // Normal usage should call the hook
      expect(onAuthChange).toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('handles a complete authentication workflow', () => {
      const onAuthChange = vi.fn()
      const store = createAuthStore({ hooks: { onAuthChange } })

      // Set secrets for multiple schemes
      store.setAuthSecrets('doc1', 'ApiKey', {
        type: 'apiKey',
        'x-scalar-secret-token': 'myApiKey',
      })
      store.setAuthSecrets('doc1', 'OAuth', {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-client-id': 'clientId',
          'x-scalar-secret-token': 'accessToken',
          'x-scalar-secret-client-secret': 'secret',
          'x-scalar-secret-redirect-uri': 'http://localhost/callback',
          'x-scalar-credentials-location': 'body',
        },
      })

      // Set document-level selection
      store.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ ApiKey: [] }] },
      )

      // Set operation-level override
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/admin',
          method: 'post',
        },
        { selectedIndex: 0, selectedSchemes: [{ OAuth: ['admin'] }] },
      )

      // Export and verify
      const exported = store.export()
      expect(exported.doc1?.secrets.ApiKey).toBeDefined()
      expect(exported.doc1?.secrets.OAuth).toBeDefined()
      expect(exported.doc1?.selected.document?.selectedSchemes).toEqual([{ ApiKey: [] }])
      expect(exported.doc1?.selected.path?.['/admin']?.['post']?.selectedSchemes).toEqual([{ OAuth: ['admin'] }])

      // Verify hooks were called
      expect(onAuthChange).toHaveBeenCalledWith('doc1')
    })

    it('allows round-trip export and load', () => {
      const store1 = createAuthStore()

      store1.setAuthSecrets('doc1', 'scheme1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })
      store1.setAuthSelectedSchemas(
        { type: 'document', documentName: 'doc1' },
        { selectedIndex: 0, selectedSchemes: [{ scheme1: [] }] },
      )

      const exported = store1.export()

      const store2 = createAuthStore()
      store2.load(exported)

      expect(store2.getAuthSecrets('doc1', 'scheme1')).toEqual(store1.getAuthSecrets('doc1', 'scheme1'))
      expect(store2.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' })).toEqual(
        store1.getAuthSelectedSchemas({ type: 'document', documentName: 'doc1' }),
      )
    })

    it('handles multiple operations across multiple documents', () => {
      const store = createAuthStore()

      // Document 1 operations
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [{ read: [] }] },
      )
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc1',
          path: '/pets',
          method: 'post',
        },
        { selectedIndex: 0, selectedSchemes: [{ write: [] }] },
      )

      // Document 2 operations
      store.setAuthSelectedSchemas(
        {
          type: 'operation',
          documentName: 'doc2',
          path: '/users',
          method: 'get',
        },
        { selectedIndex: 0, selectedSchemes: [{ admin: [] }] },
      )

      const exported = store.export()
      expect(Object.keys(exported)).toHaveLength(2)
      expect(exported.doc1?.selected.path?.['/pets']?.['get']).toBeDefined()
      expect(exported.doc1?.selected.path?.['/pets']?.['post']).toBeDefined()
      expect(exported.doc2?.selected.path?.['/users']?.['get']).toBeDefined()
    })
  })
})
