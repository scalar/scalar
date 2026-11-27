import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { updateSelectedServer, updateServerVariables } from '@/mutators/server'
import { resolveServerUrl } from '@/request-example/builder/helpers/resolve-server-url'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'

import { getRequestExampleContext } from './get-request-example-context'

const createMinimalDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => ({
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        responses: {},
      },
    },
  },
  components: {
    securitySchemes: {
      apiKeyHeader: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    },
  },
  ...overrides,
})

describe('getRequestExampleContext', () => {
  it('targets document variables when configured servers override operation servers', async () => {
    const workspaceStore = createWorkspaceStore()
    const configuredServers = [{ url: 'https://{env}.example.com', variables: { env: { default: 'prod' } } }]
    await workspaceStore.addDocument({
      name: 'test',
      document: createMinimalDocument({
        servers: configuredServers,
        paths: { '/pets': { get: { servers: [{ url: 'https://operation.example.com' }], responses: {} } } },
      }),
    })
    const result = getRequestExampleContext(
      workspaceStore,
      'test',
      { path: '/pets', method: 'get', exampleName: 'default' },
      { servers: configuredServers },
    )
    assert(result.ok)
    expect(result.data.servers.meta).toStrictEqual({ type: 'document' })
    expect(result.data.servers.selected).toStrictEqual(configuredServers[0])

    const withoutOverride = getRequestExampleContext(
      workspaceStore,
      'test',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {},
    )
    assert(withoutOverride.ok)
    expect(withoutOverride.data.servers.meta).toStrictEqual({ type: 'operation', path: '/pets', method: 'get' })
  })

  it('uses and edits path-item servers when the operation inherits them', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test',
      document: createMinimalDocument({
        servers: [{ url: 'https://document.example.com' }],
        paths: { '/pets': { $ref: '#/components/pathItems/Pets' } },
        components: {
          pathItems: {
            Pets: {
              servers: [{ url: 'v1' }, { url: '{version}', variables: { version: { default: 'v2' } } }],
              get: { responses: {} },
              post: { responses: {}, servers: [{ url: 'https://operation.example.com' }] },
            },
          },
        },
      }),
    })
    const document = workspaceStore.workspace.documents.test ?? null
    updateSelectedServer(document, { url: 'https://document.example.com', meta: { type: 'document' } })
    const requestContext = (method: string, options = { baseServerUrl: 'https://configured.example.com/api' }) =>
      getRequestExampleContext(workspaceStore, 'test', { path: '/pets', method, exampleName: 'default' }, options)

    const inherited = requestContext('get')
    assert(inherited.ok)
    const { meta } = inherited.data.servers
    expect(meta).toStrictEqual({ type: 'path-item', path: '/pets' })
    expect(resolveServerUrl(inherited.data.servers.selected)).toBe('https://configured.example.com/api/v1')

    updateSelectedServer(document, { url: '{version}', meta })
    updateServerVariables(document, { index: 1, key: 'version', value: 'v3', meta })
    const updated = requestContext('get')
    assert(updated.ok)
    expect(resolveServerUrl(updated.data.servers.selected)).toBe('https://configured.example.com/api/v3')

    const overridden = requestContext('post')
    assert(overridden.ok)
    expect(overridden.data.servers.selected).toStrictEqual({ url: 'https://operation.example.com' })
  })

  it('merges options.authentication securitySchemes into security.schemes', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'scalar-galaxy',
      document: createMinimalDocument(),
    })

    const result = getRequestExampleContext(
      workspaceStore,
      'scalar-galaxy',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {
        authentication: {
          securitySchemes: {
            apiKeyHeader: {
              value: 'YOUR_SECRET_TOKEN',
            },
          },
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.security.schemes.apiKeyHeader).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      value: 'YOUR_SECRET_TOKEN',
      'x-scalar-secret-token': 'YOUR_SECRET_TOKEN',
    })
  })

  it('applies options.authentication when using fallbackDocument only', () => {
    const workspaceStore = createWorkspaceStore()
    const fallbackDocument = createMinimalDocument()

    const result = getRequestExampleContext(
      workspaceStore,
      'not-in-workspace',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {
        fallbackDocument,
        authentication: {
          securitySchemes: {
            apiKeyHeader: {
              value: 'CONFIG_ONLY_TOKEN',
            },
          },
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.security.schemes.apiKeyHeader).toMatchObject({
      'x-scalar-secret-token': 'CONFIG_ONLY_TOKEN',
    })
  })

  it('prefers auth store secrets over options.authentication for the same scheme', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument(),
    })

    workspaceStore.auth.setAuthSecrets('doc', 'apiKeyHeader', {
      type: 'apiKey',
      'x-scalar-secret-token': 'STORE_TOKEN',
    })

    const result = getRequestExampleContext(
      workspaceStore,
      'doc',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {
        authentication: {
          securitySchemes: {
            apiKeyHeader: {
              value: 'CONFIG_TOKEN',
            },
          },
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.security.schemes.apiKeyHeader).toMatchObject({
      value: 'CONFIG_TOKEN',
      'x-scalar-secret-token': 'STORE_TOKEN',
    })
  })

  it('resolves selectedSchemes using selectedIndex from the selected security', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        security: [{ apiKeyHeader: [] }],
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: '/pets',
      method: 'get',
      exampleName: 'default',
    })

    expect(result.ok).toBe(true)
    assert(result.ok)

    expect(result.data.security.selected.selectedIndex).toBe(0)
    expect(result.data.security.selectedSchemes).toStrictEqual([
      expect.objectContaining({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }),
    ])
  })

  it('returns empty selectedSchemes when selectedIndex is -1 (optional auth)', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        security: [{}],
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: '/pets',
      method: 'get',
      exampleName: 'default',
    })

    assert(result.ok)

    expect(result.data.security.selected.selectedIndex).toBe(-1)
    expect(result.data.security.selectedSchemes).toStrictEqual([])
  })

  it('resolves selectedSchemes from the correct index when multiple requirements exist', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        components: {
          securitySchemes: {
            apiKeyHeader: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
            },
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
        security: [{ apiKeyHeader: [] }, { bearerAuth: [] }],
      }),
    })

    workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'doc' },
      {
        selectedIndex: 1,
        selectedSchemes: [{ apiKeyHeader: [] }, { bearerAuth: [] }],
      },
    )

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: '/pets',
      method: 'get',
      exampleName: 'default',
    })

    expect(result.ok).toBe(true)
    assert(result.ok)

    expect(result.data.security.selected.selectedIndex).toBe(1)
    expect(result.data.security.selectedSchemes).toStrictEqual([
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    ])
  })

  it('resolves webhook operations without inheriting document servers', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        openapi: '3.1.1',
        servers: [{ url: 'https://api.example.com' }],
        webhooks: {
          'delivery.created': {
            post: {
              summary: 'Receive a delivery',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        eventType: { type: 'string' },
                        deliveryId: { type: 'string' },
                      },
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: 'delivery.created',
      method: 'post',
      exampleName: 'default',
      isWebhook: true,
    })

    assert(result.ok)
    expect(result.data.operation.summary).toBe('Receive a delivery')
    expect(result.data.servers.list).toStrictEqual([])
    expect(result.data.servers.selected).toBeNull()
  })

  it('does not resolve webhook names as API paths', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        openapi: '3.1.1',
        webhooks: {
          'delivery.created': {
            post: { responses: {} },
          },
        },
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: 'delivery.created',
      method: 'post',
      exampleName: 'default',
    })

    expect(result).toStrictEqual({
      ok: false,
      error: 'Path delivery.created not found',
    })
  })

  it('reports a missing webhook operation method', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        openapi: '3.1.1',
        webhooks: {
          'delivery.created': {
            post: { responses: {} },
          },
        },
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: 'delivery.created',
      method: 'get',
      exampleName: 'default',
      isWebhook: true,
    })

    expect(result).toStrictEqual({
      ok: false,
      error: 'Method get not found on webhook delivery.created',
    })
  })
})
