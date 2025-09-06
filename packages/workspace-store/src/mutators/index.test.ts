import { describe, expect, it } from 'vitest'

import { createWorkspaceStore, generateClientMutators } from '@/client'

describe('generateClientMutators', () => {
  describe('cookieMutators', () => {
    it('should handle cookies on the workspace level', () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Adds a cookie
      const success = mutators.workspace().cookieMutators.addCookie({
        name: 'token',
        value: '12345',
        domain: 'example.com',
        path: '/',
      })

      expect(success).toBe(true)
      expect(store.workspace['x-scalar-client-config-cookies']).toEqual({
        token: {
          name: 'token',
          value: '12345',
          domain: 'example.com',
          path: '/',
        },
      })

      // Should not add a cookie with the same name
      expect(
        mutators.workspace().cookieMutators.addCookie({
          name: 'token',
          value: 'different-value',
          domain: 'example.com',
          path: '/',
        }),
      ).toBe(false)

      // Delete the cookie
      mutators.workspace().cookieMutators.deleteCookie('token')
      expect(store.workspace['x-scalar-client-config-cookies']).toEqual({})
    })

    it('should handle cookies on the document level', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({ name: 'test-doc', document: {} })
      await store.addDocument({ name: 'doc-2', document: {} })

      // Adds a cookie to the document
      const success = mutators.doc('test-doc').cookieMutators.addCookie({
        name: 'session',
        value: 'session-id',
        domain: 'example.com',
      })

      expect(success).toBe(true)
      expect(store.workspace.documents['test-doc']?.['x-scalar-client-config-cookies']).toEqual({
        session: {
          name: 'session',
          value: 'session-id',
          domain: 'example.com',
        },
      })

      expect(store.workspace.documents['doc-2']?.['x-scalar-client-config-cookies']).toBeUndefined()

      // Set the active document to 'doc-2'
      store.workspace['x-scalar-active-document'] = 'doc-2'

      // Should not add a cookie to the active document if it doesn't exist
      expect(
        mutators.active().cookieMutators.addCookie({
          name: 'session',
          value: 'new-session-id',
          domain: 'example.com',
        }),
      ).toBe(true)

      expect(store.workspace.documents['doc-2']?.['x-scalar-client-config-cookies']).toEqual({
        session: {
          name: 'session',
          value: 'new-session-id',
          domain: 'example.com',
        },
      })
    })
  })

  describe('environmentMutators', () => {
    it('should handle environments on the workspace level', () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      expect(
        mutators.workspace().environmentMutators.addEnvironment('dev', {
          variables: {
            API_URL: {
              default: 'https://api.dev.example.com',
            },
          },
          color: '#ff0000',
        }),
      ).toBe(true)

      expect(
        mutators.workspace().environmentMutators.addEnvironment('prod', {
          variables: {
            API_URL: {
              default: 'https://api.example.com',
            },
          },
          color: '#ff0000',
        }),
      ).toBe(true)

      expect(store.workspace['x-scalar-client-config-environments']).toEqual({
        dev: {
          variables: {
            API_URL: {
              default: 'https://api.dev.example.com',
            },
          },
          color: '#ff0000',
        },
        prod: {
          variables: {
            API_URL: {
              default: 'https://api.example.com',
            },
          },
          color: '#ff0000',
        },
      })

      expect(
        mutators.workspace().environmentMutators.addEnvironment('dev', {
          variables: {
            API_URL: {
              default: 'https://api.dev.example.com',
            },
          },
          color: '#ff0000',
        }),
      ).toBe(false)

      expect(mutators.workspace().environmentMutators.deleteEnvironment('dev')).toBe(true)

      expect(store.workspace['x-scalar-client-config-environments']).toEqual({
        prod: {
          variables: {
            API_URL: {
              default: 'https://api.example.com',
            },
          },
          color: '#ff0000',
        },
      })
    })

    it('should handle environments on the document level', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({ name: 'test-doc', document: {} })
      await store.addDocument({ name: 'doc-2', document: {} })

      expect(
        mutators.doc('test-doc').environmentMutators.addEnvironment('staging', {
          variables: {
            API_URL: {
              default: 'https://api.staging.example.com',
            },
          },
          color: '#00ff00',
        }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.['x-scalar-client-config-environments']).toEqual({
        staging: {
          variables: {
            API_URL: {
              default: 'https://api.staging.example.com',
            },
          },
          color: '#00ff00',
        },
      })

      expect(store.workspace.documents['doc-2']?.['x-scalar-client-config-environments']).toBeUndefined()

      // Set the active document to 'doc-2'
      store.workspace['x-scalar-active-document'] = 'doc-2'

      // Should not add an environment to the active document if it doesn't exist
      expect(
        mutators.active().environmentMutators.addEnvironment('staging', {
          variables: {
            API_URL: {
              default: 'https://api.staging.example.com',
            },
          },
          color: '#00ff00',
        }),
      ).toBe(true)

      expect(store.workspace.documents['doc-2']?.['x-scalar-client-config-environments']).toEqual({
        staging: {
          variables: {
            API_URL: {
              default: 'https://api.staging.example.com',
            },
          },
          color: '#00ff00',
        },
      })
    })
  })

  describe('securitySchemeMutators', () => {
    it('should handle security schemes on the workspace level', () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      expect(
        mutators.workspace().securitySchemeMutators.addSecurityScheme('apiKey', {
          type: 'apiKey',
          name: 'api_key',
          in: 'header',
        }),
      ).toBe(true)

      expect(store.workspace['x-scalar-client-config-security-schemes']).toEqual({
        apiKey: {
          type: 'apiKey',
          name: 'api_key',
          in: 'header',
        },
      })

      expect(
        mutators.workspace().securitySchemeMutators.addSecurityScheme('apiKey', {
          type: 'apiKey',
          name: 'api_key',
          in: 'header',
        }),
      ).toBe(false)

      expect(mutators.workspace().securitySchemeMutators.deleteSecurityScheme('apiKey')).toBe(true)

      expect(store.workspace['x-scalar-client-config-security-schemes']).toEqual({})
    })

    it('should handle security schemes on the document level', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({ name: 'test-doc', document: {} })
      await store.addDocument({ name: 'doc-2', document: {} })

      expect(
        mutators.doc('test-doc').securitySchemeMutators.addSecurityScheme('oauth2', {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.example.com/authorize',
              tokenUrl: 'https://auth.example.com/token',
              scopes: {},
            },
          },
        }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.components?.securitySchemes).toEqual({
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.example.com/authorize',
              tokenUrl: 'https://auth.example.com/token',
              scopes: {},
            },
          },
        },
      })

      expect(store.workspace.documents['doc-2']?.components?.securitySchemes).toBeUndefined()

      // Set the active document to 'doc-2'
      store.workspace['x-scalar-active-document'] = 'doc-2'

      // Should not add a security scheme to the active document if it doesn't exist
      expect(
        mutators.active().securitySchemeMutators.addSecurityScheme('oauth2', {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.example.com/authorize',
              tokenUrl: 'https://auth.example.com/token',
              scopes: {},
            },
          },
        }),
      ).toBe(true)

      expect(store.workspace.documents['doc-2']?.components?.securitySchemes).toEqual({
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.example.com/authorize',
              tokenUrl: 'https://auth.example.com/token',
              scopes: {},
            },
          },
        },
      })
    })
  })

  describe('serverMutators', () => {
    it('should handle servers on the workspace level', () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      expect(
        mutators.workspace().serverMutators.addServer({
          url: 'https://api.example.com',
          description: 'Production server',
        }),
      ).toBe(true)

      expect(store.workspace['x-scalar-client-config-servers']).toEqual([
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ])

      expect(mutators.workspace().serverMutators.deleteServer('https://api.example.com')).toBe(true)
      expect(store.workspace['x-scalar-client-config-servers']).toEqual([])
    })

    it('should handle servers on the document level', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({ name: 'test-doc', document: {} })
      await store.addDocument({ name: 'doc-2', document: {} })

      expect(
        mutators.doc('test-doc').serverMutators.addServer({
          url: 'https://api.test-doc.example.com',
          description: 'Test Document server',
        }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.servers).toEqual([
        {
          url: 'https://api.test-doc.example.com',
          description: 'Test Document server',
        },
      ])

      expect(mutators.doc('test-doc').serverMutators.deleteServer('https://api.test-doc.example.com')).toBe(true)

      expect(store.workspace.documents['test-doc']?.servers).toEqual([])

      expect(store.workspace.documents['doc-2']?.servers).toBeUndefined()

      // Set the active document to 'doc-2'
      store.workspace['x-scalar-active-document'] = 'doc-2'

      expect(
        mutators.active().serverMutators.addServer({
          url: 'https://api.doc-2.example.com',
          description: 'Doc 2 server',
        }),
      ).toBe(true)

      expect(store.workspace.documents['doc-2']?.servers).toEqual([
        {
          url: 'https://api.doc-2.example.com',
          description: 'Doc 2 server',
        },
      ])
    })
  })

  describe('requestMutators', () => {
    it('should move request to a new path and method', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({
        name: 'test-doc',
        document: {
          paths: {
            '/old-path': {
              get: {
                operationId: 'getOldPath',
                responses: {
                  '200': {
                    description: 'Success',
                  },
                },
              },
            },
          },
        },
      })

      expect(store.workspace.documents['test-doc']?.paths?.['/old-path']?.get).toBeDefined()

      expect(
        mutators.doc('test-doc').requestMutators.moveRequest({
          source: { path: '/old-path', method: 'get' },
          destination: { path: '/new-path', method: 'post' },
        }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.paths?.['/old-path']).toEqual({})
      expect(store.workspace.documents['test-doc']?.paths?.['/new-path']?.post).toBeDefined()
    })

    it('should delete request', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({
        name: 'test-doc',
        document: {
          paths: {
            '/test': {
              get: {
                operationId: 'getTest',
                responses: {
                  '200': {
                    description: 'Success',
                  },
                },
              },
            },
          },
        },
      })

      expect(store.workspace.documents['test-doc']?.paths?.['/test']?.get).toBeDefined()

      expect(
        mutators.doc('test-doc').requestMutators.deleteRequest({
          path: '/test',
          method: 'get',
        }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.paths?.['/test']).toEqual({})
    })
  })

  describe('requestExampleMutators', () => {
    it('should add and delete request examples', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({
        name: 'test-doc',
        document: {
          paths: {
            '/example': {
              get: {
                operationId: 'getExample',
                responses: {
                  '200': {
                    description: 'Success',
                  },
                },
              },
            },
          },
        },
      })

      expect(
        mutators.doc('test-doc').requestExampleMutators.addRequestExample({
          path: '/example',
          method: 'get',
          request: {
            parameters: {
              header: {
                'X-Custom-Header': 'value',
              },
            },
          },
          slug: 'exampleRequest',
        }),
      ).toBe(true)

      // Should not add the same request example again
      expect(
        mutators.doc('test-doc').requestExampleMutators.addRequestExample({
          path: '/example',
          method: 'get',
          request: {
            parameters: {
              header: {
                'X-Custom-Header': 'value',
              },
            },
          },
          slug: 'exampleRequest',
        }),
      ).toBe(false)

      expect(store.workspace.documents['test-doc']?.paths?.['/example']?.get).toBeDefined()
      expect(store.workspace.documents['test-doc']?.paths?.['/example']?.get).toEqual({
        operationId: 'getExample',
        responses: {
          200: {
            description: 'Success',
          },
        },
        'x-scalar-client-config-request-example': {
          exampleRequest: {
            parameters: {
              header: {
                'X-Custom-Header': 'value',
              },
            },
          },
        },
      })

      expect(
        mutators
          .doc('test-doc')
          .requestExampleMutators.deleteRequestExample({ path: '/example', method: 'get', slug: 'exampleRequest' }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.paths?.['/example']?.get).toEqual({
        operationId: 'getExample',
        responses: {
          200: {
            description: 'Success',
          },
        },
        'x-scalar-client-config-request-example': {},
      })
    })

    it('should create request if it does not exist', async () => {
      const store = createWorkspaceStore()
      const mutators = generateClientMutators(store)

      // Create an empty document
      await store.addDocument({
        name: 'test-doc',
        document: {
          paths: {},
        },
      })

      expect(
        mutators.doc('test-doc').requestExampleMutators.addRequestExample({
          path: '/example',
          method: 'get',
          request: {
            parameters: {
              header: {
                'X-Custom-Header': 'value',
              },
            },
          },
          slug: 'exampleRequest',
        }),
      ).toBe(true)

      expect(store.workspace.documents['test-doc']?.paths?.['/example']?.get).toBeDefined()
      expect(store.workspace.documents['test-doc']?.paths?.['/example']?.get).toEqual({
        'x-scalar-client-config-request-example': {
          exampleRequest: {
            parameters: {
              header: {
                'X-Custom-Header': 'value',
              },
            },
          },
        },
      })
    })
  })
})
