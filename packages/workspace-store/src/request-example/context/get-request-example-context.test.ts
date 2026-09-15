import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
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
